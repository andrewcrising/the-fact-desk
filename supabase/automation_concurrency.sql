-- Prevent overlapping schedulers from processing the same new feed items at once.
-- Stale runs are explicitly failed by the repository before a new run is claimed.
create unique index if not exists automation_runs_single_running_idx
  on public.automation_runs ((true))
  where status = 'running';
