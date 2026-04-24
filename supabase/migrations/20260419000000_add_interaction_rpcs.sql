/* Migration: Add RPCs for Post Interactions (Likes, Zaps, Comments) */

/* increment_post_zap */
CREATE OR REPLACE FUNCTION increment_post_zap(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE posts
  SET zap_count = zap_count + 1
  WHERE post_id = p_id;
END;
$$;

/* decrement_post_zap */
CREATE OR REPLACE FUNCTION decrement_post_zap(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE posts
  SET zap_count = GREATEST(0, zap_count - 1)
  WHERE post_id = p_id;
END;
$$;

/* increment_post_like */
CREATE OR REPLACE FUNCTION increment_post_like(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE posts
  SET like_count = like_count + 1
  WHERE post_id = p_id;
END;
$$;

/* decrement_post_like */
CREATE OR REPLACE FUNCTION decrement_post_like(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE posts
  SET like_count = GREATEST(0, like_count - 1)
  WHERE post_id = p_id;
END;
$$;

/* increment_post_comment */
CREATE OR REPLACE FUNCTION increment_post_comment(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE posts
  SET comment_count = comment_count + 1
  WHERE post_id = p_id;
END;
$$;
