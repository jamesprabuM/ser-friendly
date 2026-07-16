
-- Roles enum + table
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile write" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('coffee','spice','gift')),
  roast TEXT CHECK (roast IN ('light','medium','dark','none')),
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  weight TEXT,
  origin TEXT,
  short_description TEXT,
  description TEXT,
  tasting_notes TEXT[] DEFAULT '{}',
  image_key TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 100,
  featured BOOLEAN NOT NULL DEFAULT false,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "published products are public" ON public.products FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "admins manage products" ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','shipped','cancelled')),
  subtotal_cents INTEGER NOT NULL,
  shipping_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL,
  ship_name TEXT NOT NULL,
  ship_email TEXT NOT NULL,
  ship_address TEXT NOT NULL,
  ship_city TEXT NOT NULL,
  ship_postal TEXT NOT NULL,
  ship_country TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert own orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL
);
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own order items" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
CREATE POLICY "insert own order items" ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

-- Newsletter
CREATE TABLE public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.newsletter_subscribers TO anon, authenticated;
GRANT ALL ON public.newsletter_subscribers TO service_role;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can subscribe" ON public.newsletter_subscribers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admins read subscribers" ON public.newsletter_subscribers FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed catalog
INSERT INTO public.products (slug, name, category, roast, price_cents, weight, origin, short_description, description, tasting_notes, image_key, featured) VALUES
('finca-los-cedros-light','Finca Los Cedros — Light Roast','coffee','light',2200,'250 g','Huila, Colombia',
 'Delicate washed Colombian with jasmine and stonefruit.',
 'Grown at 1,800 metres in the shade of native cedars, this washed lot is fermented for 48 hours in mountain spring water and dried slowly on our raised patios. A crystalline cup that rewards a careful pour-over.',
 ARRAY['jasmine','white peach','honey'],'coffee-1', true),
('finca-los-cedros-medium','Finca Los Cedros — Medium Roast','coffee','medium',2200,'250 g','Huila, Colombia',
 'Rounded chocolate and red apple, our house roast.',
 'Roasted to first crack plus ninety seconds, this profile brings out the deeper caramel notes of our estate coffee while preserving its natural sweetness. Excellent for espresso and drip alike.',
 ARRAY['dark cocoa','red apple','brown sugar'],'coffee-3', true),
('finca-los-cedros-dark','Finca Los Cedros — Dark Roast','coffee','dark',2400,'250 g','Huila, Colombia',
 'A deep, syrupy roast for milk drinks and moka pots.',
 'A slower, patient roast that develops rich caramelisation without bitterness. Cocoa forward with a lingering, syrupy finish. Our recommendation for anyone who takes milk in their cup.',
 ARRAY['baker''s chocolate','molasses','toasted walnut'],'coffee-2', false),
('nilgiri-peaberry','Nilgiri Peaberry','coffee','medium',2600,'250 g','Nilgiri Hills, India',
 'Rare single-bean lot with bright citrus and cane sugar.',
 'Peaberry beans are the naturally rounder singles found in roughly five percent of the harvest. Hand-sorted and washed, this micro-lot offers a distinctly bright cup.',
 ARRAY['bergamot','cane sugar','black tea'],'coffee-1', false),
('malabar-black-pepper','Malabar Black Pepper','spice','none',1400,'80 g','Kerala, India',
 'Sun-dried Tellicherry peppercorns with heat and floral heart.',
 'Vine-ripened and sun-dried on our estate, these Tellicherry-grade peppercorns are graded, tumbled and hand-sorted. Bold heat with a warm citrus finish — a very different pepper.',
 ARRAY['citrus peel','pine','warm heat'],'pepper', true),
('green-cardamom','Green Cardamom Pods','spice','none',1800,'50 g','Idukki, India',
 'Bright, resinous pods for coffee, chai and desserts.',
 'Harvested green and slow-cured to preserve the essential oils, our cardamom is intensely aromatic. Crush a pod into fresh coffee grounds — it is a small revelation.',
 ARRAY['eucalyptus','citrus','resin'],'cardamom', true),
('ceylon-cinnamon','Ceylon Cinnamon Quills','spice','none',1200,'60 g','Matale, Sri Lanka',
 'True cinnamon: soft, layered, and delicate.',
 'True Ceylon cinnamon — not cassia — hand-rolled into paper-thin quills. Warm, floral, and gently sweet, with none of cassia''s harsh bite.',
 ARRAY['warm floral','clove','honey'],'cinnamon', false),
('whole-cloves','Whole Cloves','spice','none',1000,'50 g','Zanzibar',
 'Fat, oily cloves for slow braises and mulled wine.',
 'Sun-dried cloves with unusually high essential-oil content. Sweet, resinous, and warming — indispensable for winter cooking and slow-simmered stocks.',
 ARRAY['sweet resin','pepper','warmth'],'cloves', false),
('estate-gift-box','Estate Gift Box','gift','none',6800,'assorted','Kani Estate',
 'Our medium roast plus three signature spices in a linen-wrapped box.',
 'A curated introduction to Kani Estate: our medium roast Los Cedros coffee, Malabar pepper, green cardamom and Ceylon cinnamon. Nestled in tissue and finished with a wax seal.',
 ARRAY['gift','sampler','estate'],'gift', true);
