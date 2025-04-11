<script lang="ts">
  import { goto } from "$app/navigation";
  import { LoggedIn } from "$lib/state";
  import { onMount } from "svelte";
  import { PB } from "../state";
  import type { RecordModel } from "pocketbase";
  import { ConnectPocketBase, PB_URL } from "../api";

  let round_active = $state(false);

  let buzzers: { [key: string]: RecordModel } = $state({});
  let buzzed: string[] = $state([]);

  let cleanup: number = 0;
  let start_time: Date;

  let first_buzzed = false;
  let show_connected = $state(false);

  onMount(async () => {
    if (!$PB) {
      ConnectPocketBase(PB_URL);
    }
    if (!$LoggedIn) {
      // goto("/")
    }

    (await $PB!.collection("buzzer").getFullList({ requestKey: null })).forEach(
      (buzzer) => {
        buzzers[buzzer.id] = buzzer;
      }
    );

    set_round(false);

    $PB!.collection("buzzer").subscribe("*", async (e) => {
      if (e.action == "create") {
        buzzers[e.record.id] = e.record;
      }

      if (e.action == "delete") {
        delete buzzers[e.record.id];
        buzzers = buzzers;
      }

      if (e.action === "update") {
        buzzers[e.record.id] = e.record;

        if (e.record.buzzed === true && round_active) {
          if (!first_buzzed) {
            first_buzzed = true;
            let buzzed = new Audio("/buzz.wav");
            buzzed.play();
          }
          buzzers[e.record.id].buzzed_in =
            new Date(buzzers[e.record.id].last_buzzed).getTime() -
            start_time.getTime();
          if (!buzzed.includes(e.record.id)) buzzed.push(e.record.id);
        }

        buzzed.sort(
          (a, b) =>
            new Date(buzzers[a].last_buzzed).getTime() -
            new Date(buzzers[b].last_buzzed).getTime()
        );
      }
    });

    cleanup = setInterval(async () => {
      const now = Date.now();
      const threshold = 30000;

      for (let id of Object.keys(buzzers)) {
        let buzzer = buzzers[id];
        const lastSeen = new Date(buzzer.last_seen).getTime();
        if (now - lastSeen > threshold) {
          await $PB!
            .collection("buzzer")
            .delete(buzzer.id, { requestKey: null });
          console.log("Deleted stale buzzer:", buzzer.team_name);
          delete buzzers[id];
        }
      }
    }, 10000);

    onbeforeunload = () => {
      clearInterval(cleanup);
    };
  });

  async function set_round(status: boolean) {
    round_active = status;

    if (round_active) {
      start_time = new Date();
    }

    if (!round_active) {
      buzzed = [];
      first_buzzed = false;

      for (let id of Object.keys(buzzers)) {
        await $PB!.collection("buzzer").update(
          id,
          {
            buzzed: false,
            last_buzzed: null,
          },
          { requestKey: null }
        );
      }
    }
  }

  function delete_buzzer(buzzer: string): any {
    $PB!.collection("buzzer").delete(buzzer, { requestKey: null });
  }
</script>

<div class="wrapper">
  <img src="/quizzbuzz_school_branded_color.svg" alt="quizzbuzz" class="logo" />

  <button
    class="control"
    onclick={() => {
      set_round(!round_active);
    }}
  >
    {#if round_active}
      <span class="material-icons-outlined">restart_alt</span>
      Reset Round
    {:else}
      <span class="material-icons-outlined">play_arrow</span>
      Start Round
    {/if}
  </button>

  {#if round_active && buzzed.length > 0}
    <div class="sfx">
      <button
        class="correct"
        onclick={() => {
          let correct = new Audio("/correct.wav");
          correct.play();
        }}><span class="material-icons">check</span> Correct</button
      >
      <button
        class="wrong"
        onclick={() => {
          let wrong = new Audio("/wrong.wav");
          wrong.play();
        }}><span class="material-icons">close</span>Incorrect</button
      >
    </div>
  {/if}

  {#if round_active}
    <div class="buzzed">
      <div class="title">
        <p class="title_text">Buzzed</p>
        <p class="count">{buzzed.length}</p>
      </div>
      {#each buzzed as buzzer, i}
        <div class="buzzer {i === 0 ? 'first' : ''}">
          <div class="info">
            <p>{buzzers[buzzer].team_name}</p>
            <p class="id">{buzzer}</p>
          </div>
          <div class="in">{buzzers[buzzer].buzzed_in / 1000}s</div>
        </div>
      {/each}
    </div>
  {/if}

  <div class="connected">
    <div class="title">
      <div class="collapse">
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="icon" onclick={() => (show_connected = !show_connected)}>
          {#if show_connected}
            <span class="material-icons-outlined">keyboard_arrow_down</span>
          {:else}
            <span class="material-icons-outlined">keyboard_arrow_right</span>
          {/if}
        </div>
        <p class="title_text">Connected</p>
      </div>
      <p class="count">{Object.keys(buzzers).length}</p>
    </div>
    {#if show_connected}
      {#each Object.keys(buzzers) as buzzer}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="buzzer">
          <div class="info">
            <p>{buzzers[buzzer].team_name}</p>
            <p class="id">{buzzer}</p>
          </div>
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <div class="remove" onclick={() => delete_buzzer(buzzer)}>
            <span class="material-icons-outlined">delete</span>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style lang="scss">
  .wrapper {
    width: 90vw;
    margin-inline: auto;
    display: flex;
    flex-direction: column;
    align-items: center;

    button {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      margin-bottom: 1rem;
      &:hover {
        scale: 102%;
      }
    }

    .sfx {
      display: flex;
      width: 100%;
      gap: 0.5rem;
      font-weight: 700;

      .correct {
        background: #218c53;
      }

      .wrong {
        background: #e03e52;
      }
    }

    img {
      width: clamp(300px, 40%, 700px);
      margin-block: 1rem;
    }

    .connected,
    .buzzed {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: start;
      gap: 1rem;
      margin-block: 1rem;
      .title {
        font-weight: 500;
        display: flex;
        justify-content: space-between;
        width: 100%;
        .count {
          opacity: 0.4;
        }
      }
    }

    .connected {
      .collapse {
        display: flex;
        gap: 0.5rem;

        .icon,
        .icon * {
          cursor: pointer;
        }
      }
    }

    .buzzer {
      width: 100%;
      border-radius: 0.3rem;
      padding: 0.5rem 1rem;
      box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.3);
      display: flex;
      justify-content: space-between;

      &.first {
        box-shadow: 0px 0px 10px 5px rgba(10, 80, 10, 0.277);
      }

      .info {
        p {
          font-size: 1.3rem;
        }

        .id {
          font-size: 0.8rem;
          opacity: 0.5;
        }
      }

      .remove {
        color: rgb(214, 58, 58);
        margin-left: 2rem;
        cursor: pointer;
      }
    }
  }
</style>
