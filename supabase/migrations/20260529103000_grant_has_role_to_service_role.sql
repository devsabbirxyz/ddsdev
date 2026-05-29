-- Server-side admin operations use the service_role client and still need
-- explicit EXECUTE privilege when RLS policies reference public.has_role().
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

-- Keep authenticated users able to evaluate role-based RLS policies.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
