<script lang="ts">
  import { browser } from '$app/environment';
  import TextLink from '$lib/components/text-link.svelte';
  export let company: string;
  export let position: string;
  export let url: string | undefined = undefined;
  export let timeFrame: string | undefined = undefined;
  export let location: string | undefined = undefined;
  import * as Sentry from '@sentry/svelte';
  import { onDestroy } from 'svelte';
  import { SpanStatus } from '@sentry/tracing';
  if (browser) {
    Sentry.setTag('component', 'Test');
    onDestroy(() => {
      Sentry.setTag('component', undefined);
    });
    const currentSpan = Sentry.getActiveTransaction();
    currentSpan?.setStatus(SpanStatus.Ok || Sentry.SpanStatus.Ok);
  }
</script>
<div class="flex flex-col w-full">
  {#if url}
    <h3>
      <TextLink href={url}><span class="font-bold text-lg">{company}</span></TextLink>
    </h3>
  {:else}
    <h3><span class="font-bold text-lg">{company}</span></h3>
  {/if}
  <span class="whitespace-nowrap">{position}</span>
  {#if timeFrame}
    <span class="whitespace-nowrap text-xs">{timeFrame}</span>
  {/if}
  {#if location}
    <span class="whitespace-nowrap text-xs">{location}</span>
  {/if}
</div>
