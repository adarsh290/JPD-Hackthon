-- Fix function search paths for security
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.increment_link_click()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.links SET click_count = click_count + 1 WHERE id = NEW.link_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.increment_hub_visit()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.hubs SET total_visits = total_visits + 1 WHERE id = NEW.hub_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop the overly permissive policies for link_clicks and hub_visits inserts
-- Replace with more restricted policies that still allow public tracking
DROP POLICY IF EXISTS "Anyone can insert clicks" ON public.link_clicks;
DROP POLICY IF EXISTS "Anyone can insert visits" ON public.hub_visits;

-- Create new policies that validate the hub exists and is active
CREATE POLICY "Can insert clicks for active hubs" ON public.link_clicks FOR INSERT 
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.hubs h 
        JOIN public.links l ON l.hub_id = h.id 
        WHERE l.id = link_clicks.link_id 
        AND h.is_active = true
    ));

CREATE POLICY "Can insert visits for active hubs" ON public.hub_visits FOR INSERT 
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.hubs 
        WHERE hubs.id = hub_visits.hub_id 
        AND hubs.is_active = true
    ));