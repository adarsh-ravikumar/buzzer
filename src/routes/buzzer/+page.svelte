<script lang="ts">
  import { goto } from "$app/navigation";
  import { nanoid } from "nanoid";
  import { onMount } from "svelte";

  import { PB, TEAM_NAME, BUZZER } from "../state";

  let team_name = $state("");
  let can_register = $derived(team_name.trim().length > 0);
  let exists = $state(false);
  let loading = $state(false);

  async function register() {
    if (!can_register || !$PB) return;

    loading = true;
    let existing;

    try {
      existing = await $PB
        .collection("buzzer")
        .getFirstListItem(`team_name="${team_name}"`);
    } catch {}
    loading = false;

    if (existing) return (exists = true);

    $BUZZER = await $PB.collection("buzzer").create({
      team_name: team_name,
      buzzed: false,
      allowed: false,
    });

    goto(`/buzzer/${$BUZZER!.id}`);
  }
</script>

<div class="wrapper">
  <img src="/quizzbuzz_school_branded_color.svg" alt="quizzbuzz" class="logo" />

  <div class="container">
    <div class="row">
      <p>Enter Your Team Name</p>
      <input
        type="text"
        bind:value={team_name}
        oninput={() => {
          exists = false;
        }}
      />
    </div>
    {#if exists}
      <p class="error">Team already exist! Pick a different name!</p>
    {/if}
    <button disabled={!can_register} onclick={register}>
      {#if loading}
        <span class="loader"></span>
      {:else}
        Go!
      {/if}
    </button>
  </div>
</div>

<style lang="scss">
  .loader {
    width: 20px;
    height: 20px;
    border: 3px solid rgba(255, 255, 255, 0.502);
    border-bottom-color: #ffffff;
    border-radius: 50%;
    display: inline-block;
    box-sizing: border-box;
    animation: rotation 1s linear infinite;
  }

  @keyframes rotation {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .wrapper {
    margin-inline: auto;
    width: clamp(200px, 80vw, 500px);
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    img {
      width: 100%;
    }

    .container {
      background: white;
      border-radius: 0.3rem;
      padding: 1rem;
      width: 100%;

      .row {
        p {
          font-weight: 500;
          margin-bottom: 0.5rem;
        }
        input {
          width: 100%;
        }
      }

      .error {
        text-align: center;
        font-weight: normal;
        margin-top: 1rem;
        color: #c5182c;
      }

      button {
        margin-top: 2rem;

        width: 100%;
        &:disabled {
          cursor: not-allowed;
          opacity: 0.2;
          &:hover {
            scale: 100%;
          }
          &:active {
            scale: 100%;
          }
        }
      }
    }
  }
</style>
