-- Photo URL updates generated from content/superhero-content.xlsx
-- 1 actor(s), 2 character(s). Skipped 31 fragile/thumbnail link(s).
-- Review, then run in the Supabase SQL Editor.
begin;

update public.actors set photo_url = 'https://m.media-amazon.com/images/M/MV5BMjUxMjE4MTQxMF5BMl5BanBnXkFtZTcwNzc2MDM1NA@@._V1_FMjpg_UX1000_.jpg$0' where name = 'Nicolas Cage';

update public.characters set photo_url = 'https://m.media-amazon.com/images/M/MV5BNmVhMDJjNDUtMGM1OS00MDVlLWI1YTEtZTEzYWUyNjRjYmJlXkEyXkFqcGc@._V1_QL75_UX500_CR0,0,500,281_.jpg' where name = 'Ghost Rider' and actor_id = (select id from public.actors where name = 'Nicolas Cage');
update public.characters set photo_url = 'https://variety.com/wp-content/uploads/2025/05/NORE_S1_UT_102_241022_EPSAAR_00447RC4-PC-Aaron-Epstein-Prime-Video.jpg?w=1000&h=667&crop=1' where name = 'Spider Noir' and actor_id = (select id from public.actors where name = 'Nicolas Cage');

commit;
