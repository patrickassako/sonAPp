
-- Create a new private bucket for input audio
insert into storage.buckets (id, name, public)
values ('input-audio', 'input-audio', true);

-- Policy to allow authenticated users to upload files
create policy "Authenticated users can upload audio"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'input-audio' );

-- Policy to allow public access to read files (so Suno can access them)
create policy "Public can read audio"
on storage.objects for select
to public
using ( bucket_id = 'input-audio' );
