-- Enable the pgvector extension
create extension if not exists vector;

-- Create the video_chunks table
create table if not exists video_chunks (
    id bigint primary key generated always as identity,
    video_id text not null,
    chunk_number integer not null,
    title text not null,
    summary text not null,
    content text not null,
    start_time float not null,
    end_time float not null,
    metadata jsonb not null default '{}',
    embedding vector(1536),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    -- Add constraint for unique video chunk combinations
    unique(video_id, chunk_number)
);

-- Create an index for the video_id
create index if not exists idx_video_chunks_video_id on video_chunks(video_id);

-- Create a function to search for similar chunks
create or replace function match_video_chunks(
    query_embedding vector(1536),
    match_count int default 5
) returns table (
    id bigint,
    video_id text,
    chunk_number integer,
    title text,
    summary text,
    content text,
    start_time float,
    end_time float,
    metadata jsonb,
    similarity float
)
language plpgsql
as $$
begin
    return query
    select
        vc.id,
        vc.video_id,
        vc.chunk_number,
        vc.title,
        vc.summary,
        vc.content,
        vc.start_time,
        vc.end_time,
        vc.metadata,
        1 - (vc.embedding <=> query_embedding) as similarity
    from video_chunks vc
    where vc.embedding is not null
    order by vc.embedding <=> query_embedding
    limit match_count;
end;
$$;
