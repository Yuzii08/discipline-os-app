-- Create 'mission_snaps' bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('mission_snaps', 'mission_snaps', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for mission_snaps bucket
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'mission_snaps' );

CREATE POLICY "Auth Insert" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'mission_snaps' AND auth.role() = 'authenticated' );

CREATE POLICY "Auth Update" 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'mission_snaps' AND auth.role() = 'authenticated' );
