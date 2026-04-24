<script lang="ts">
import { goto } from '$app/navigation';

// Settings is now split into sub-routes (profile, username, password,
// two-factor, preferences, danger-zone). Landing on /my-profile/settings
// goes straight to the Profile section so the sidebar has an active item.
$effect(() => {
  void goto('/my-profile/settings/profile', { replaceState: true });
});
</script>
