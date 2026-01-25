-- Create profiles table for user data
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Create hubs table
CREATE TABLE public.hubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    total_visits INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on hubs
ALTER TABLE public.hubs ENABLE ROW LEVEL SECURITY;

-- Hubs policies
CREATE POLICY "Users can view own hubs" ON public.hubs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own hubs" ON public.hubs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own hubs" ON public.hubs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own hubs" ON public.hubs FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view active hubs by slug" ON public.hubs FOR SELECT USING (is_active = true);

-- Create links table with conditional rules
CREATE TABLE public.links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hub_id UUID NOT NULL REFERENCES public.hubs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    icon TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    click_count INTEGER NOT NULL DEFAULT 0,
    -- Time-based rules
    time_start TIME,
    time_end TIME,
    -- Device-based rules
    device_type TEXT CHECK (device_type IN ('all', 'mobile', 'desktop')),
    -- Performance-based auto-sort
    auto_sort_enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on links
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;

-- Links policies - users can manage their own hub's links
CREATE POLICY "Users can view own hub links" ON public.links FOR SELECT 
    USING (EXISTS (SELECT 1 FROM public.hubs WHERE hubs.id = links.hub_id AND hubs.user_id = auth.uid()));
CREATE POLICY "Users can create links in own hubs" ON public.links FOR INSERT 
    WITH CHECK (EXISTS (SELECT 1 FROM public.hubs WHERE hubs.id = links.hub_id AND hubs.user_id = auth.uid()));
CREATE POLICY "Users can update own hub links" ON public.links FOR UPDATE 
    USING (EXISTS (SELECT 1 FROM public.hubs WHERE hubs.id = links.hub_id AND hubs.user_id = auth.uid()));
CREATE POLICY "Users can delete own hub links" ON public.links FOR DELETE 
    USING (EXISTS (SELECT 1 FROM public.hubs WHERE hubs.id = links.hub_id AND hubs.user_id = auth.uid()));
CREATE POLICY "Anyone can view active hub links" ON public.links FOR SELECT 
    USING (EXISTS (SELECT 1 FROM public.hubs WHERE hubs.id = links.hub_id AND hubs.is_active = true));

-- Create analytics table for tracking clicks
CREATE TABLE public.link_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id UUID NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
    hub_id UUID NOT NULL REFERENCES public.hubs(id) ON DELETE CASCADE,
    device_type TEXT,
    user_agent TEXT,
    ip_hash TEXT,
    clicked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on link_clicks
ALTER TABLE public.link_clicks ENABLE ROW LEVEL SECURITY;

-- Link clicks policies
CREATE POLICY "Users can view own hub analytics" ON public.link_clicks FOR SELECT 
    USING (EXISTS (SELECT 1 FROM public.hubs WHERE hubs.id = link_clicks.hub_id AND hubs.user_id = auth.uid()));
CREATE POLICY "Anyone can insert clicks" ON public.link_clicks FOR INSERT WITH CHECK (true);

-- Create hub visits table
CREATE TABLE public.hub_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hub_id UUID NOT NULL REFERENCES public.hubs(id) ON DELETE CASCADE,
    device_type TEXT,
    user_agent TEXT,
    ip_hash TEXT,
    visited_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on hub_visits
ALTER TABLE public.hub_visits ENABLE ROW LEVEL SECURITY;

-- Hub visits policies
CREATE POLICY "Users can view own hub visits" ON public.hub_visits FOR SELECT 
    USING (EXISTS (SELECT 1 FROM public.hubs WHERE hubs.id = hub_visits.hub_id AND hubs.user_id = auth.uid()));
CREATE POLICY "Anyone can insert visits" ON public.hub_visits FOR INSERT WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_hubs_updated_at BEFORE UPDATE ON public.hubs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_links_updated_at BEFORE UPDATE ON public.links
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to increment link click count
CREATE OR REPLACE FUNCTION public.increment_link_click()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.links SET click_count = click_count + 1 WHERE id = NEW.link_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_link_click AFTER INSERT ON public.link_clicks
    FOR EACH ROW EXECUTE FUNCTION public.increment_link_click();

-- Function to increment hub visit count
CREATE OR REPLACE FUNCTION public.increment_hub_visit()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.hubs SET total_visits = total_visits + 1 WHERE id = NEW.hub_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_hub_visit AFTER INSERT ON public.hub_visits
    FOR EACH ROW EXECUTE FUNCTION public.increment_hub_visit();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();