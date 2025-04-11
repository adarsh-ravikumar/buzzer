<script lang="ts">
    import { goto } from "$app/navigation";
    import { LoggedIn } from "$lib/state";

    let password: string = $state("");

    function login() {
        if (password == "quiz@chinmaya") {
            $LoggedIn = true;
            goto("/admin")
        } else {
            alert("Incorrect password!");
            password = ""
        }
    }
</script>

<div class="wrapper">
    <img src="/quizzbuzz_school_branded_color.svg" alt="quizzbuzz" class="logo">

    <div class="container">
        <p class="label">Password</p>
        <input type="password" bind:value={password} />
    </div>

    <button class="login" onclick={login}>Login</button>
</div>

<style lang="scss">
    .wrapper {
        display: flex;
        flex-direction: column;
        width: clamp(150px, 80vw, 500px);
        gap: 3rem;

        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);

        .container {
            display: flex;
            flex-direction: column;
            gap: 0.1rem;
        }
    }
</style>