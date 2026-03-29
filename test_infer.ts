import { supabase } from './services/supabase';

const builder = supabase.from('mission_completions');
type BuilderUpdateArgs = Parameters<typeof builder.update>[0];
type Check = BuilderUpdateArgs extends never ? "is_never" : "is_not_never";
export const check: Check = "is_never";
