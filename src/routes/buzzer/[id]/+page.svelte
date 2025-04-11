<script lang="ts">
  import { onMount } from "svelte";
  import { BUZZER, PB, TEAM_NAME } from "../../state.js";
  import { goto } from "$app/navigation";
  import { ConnectPocketBase, PB_URL } from "../../api.js";
  let { data } = $props();

  const COLORS = ["#e03e52", "#1c5253", "#54556c", "#115d76", "#d3b629"];
  let ping: number = 0;

  onMount(async () => {
    if (!$PB) ConnectPocketBase(PB_URL)
    try {
      let buzz = await $PB
        ?.collection("buzzer")
        .getFirstListItem(`id="${data.id}"`);
      $BUZZER = buzz;
    } catch {
      goto("/buzzer");
    }

    ping = setInterval(async () => {
      try {
        await $PB!.collection("buzzer").update($BUZZER!.id, {
          last_seen: new Date().toISOString(),
        });
      } catch (err) {
        console.warn("Ping failed", err);
      }
    }, 10000); // every 10 seconds

    $PB?.collection("buzzer").subscribe("*", (e) => {
      if (e.action === "delete" && e.record.id === $BUZZER!.id) {
        $BUZZER = undefined
        goto("/buzzer")
      }
    })



    onbeforeunload = () => {
      clearInterval(ping);
    };
  });

  async function buzz() {
    if (!$BUZZER) return;

    if ("vibrate" in navigator) {
      navigator.vibrate([200]);
    }

    await $PB?.collection("buzzer").update($BUZZER.id, {
      buzzed: true,
      last_buzzed: new Date().toISOString(),
    }, {requestKey: null});
  }
</script>

{#if $BUZZER}
  <div class="wrapper">
    <button
      class="buzz"
      aria-label="buzzer"
      style={`background: ${COLORS[Math.floor(Math.random() * (COLORS.length - 1))]}`}
      onclick={buzz}
    >
      <p class="team"><strong>Team: </strong> {$BUZZER!.team_name}</p>
      <img src="/quizzbuzz_school_branded_mono.svg" alt="quizzbuzz" class="logo" />
    </button>
  </div>
{/if}

<style lang="scss">
  .wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    height: 100svh;
    max-height: 100svh;
    padding: 0.5rem;

    .team {
      font-size: 1.2rem;
    }

    .buzz {
      margin: 0;
      padding: 0;

      overflow: hidden;
      img {
        width: clamp(150px, 80vw, 500px);
      }

      width: 100%;
      height: 100%;

      &:hover {
        scale: 100%;
      }

      &:active {
        scale: 95%;
      }
    }
  }
</style>
