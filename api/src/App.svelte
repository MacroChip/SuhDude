<script>
  let name;
  let id;
  let url;
  let volume = "0.7";
  let startTime;
  let endTime;
  let phrase;
  let searchPromise;
  const host = process.env.HOST;
  let submit = (e) => {
    e.preventDefault();
    searchPromise = fetch(`${host}/`).then((res) => {
      console.log("api awake. Submitting");
      return fetch(`${host}/api/change`, {
        method: "post",
        body: JSON.stringify({
          name,
          id,
          url,
          volume,
          startTime,
          endTime,
          phrase,
        }),
        headers: {
          "content-type": "application/json",
        },
      })
        .then((res) => res.json())
        .then((json) => json.uuid)
        .then((uuid) => pollForResult(uuid));
    });
  };
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  let pollForResult = async (uuid) => {
    let state;
    while (!state) {
      await sleep(1000);
      state = await fetch(`${host}/api/status?uuid=${uuid}`)
        .then((res) => res.json())
        .then((json) => json.state);
    }
    return state;
  };
</script>

<style>
  @font-face {
    font-family: "Source Code Pro";
    font-style: normal;
    font-weight: 400;
    src: local("Source Code Pro"), local("SourceCodePro-Regular"),
      url(https://themes.googleusercontent.com/static/fonts/sourcecodepro/v4/mrl8jkM18OlOQN8JLgasDxM0YzuT7MdOe03otPbuUS0.woff)
        format("woff");
  }
  :global(body) {
    font-family: Source Code Pro;
    background: #000;
    color: #00ff00;
    margin: 0;
    font-size: 18px;
  }
  img {
    display: block;
  }
  .msg {
    font-family: monospace;
    font-weight: bold;
    text-transform: uppercase;
    font-size: 5vh;
    padding-top: 5vh;
    background: red;
    box-shadow: 0 0 30px red;
    text-shadow: 0 0 20px white;
    color: white;
    width: 20vw;
    height: 15vh;
    position: absolute;
    left: 50%;
    margin-left: -10vw;
    top: 50%;
    margin-top: -5vh;
    text-align: center;
    min-width: 200px;
    animation-name: blink;
    animation-duration: 0.6s;
    animation-iteration-count: infinite;
    animation-direction: alternate;
    animation-timing-function: linear;
  }
  @keyframes blink {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
  button {
    margin: 0;
    padding: 0;
    border: none;
  }
  button {
    display: inline-block;
    font-weight: bolder;
    color: white;
    font-family: inherit;
    font-size: inherit;
    background: green;
    padding: 1em 2em;
    margin: 0.5em;
    box-shadow: 0.5em 0.5em 3px rgba(0, 0, 0, 0.5);
    position: relative;
    transition: 0.1s all ease-in;
    border: 1px outset green;
  }
  button:before {
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    content: "";
    position: absolute;
    /*background: rgba(255,255,0,.5); /* DEBUG CLICK AREA */
  }
  button:hover,
  button:active,
  button:focus,
  button:hover {
    transform: translate3d(0.25em, 0.25em, 10em);
    box-shadow: 0 0 0 rgba(0, 0, 0, 0.5);
    background: limegreen;
  }
  button:hover:before,
  button:focus:before {
    top: -1em;
    left: -1em;
  }
  button:first-letter {
    color: yellow;
  }
</style>

<svelte:head>
  <title>Chad bot</title>
</svelte:head>
<form>
  <p>your name</p>
  <input autofocus id="name" name="name" type="text" bind:value={name} />
  <p>
    your discord id (<a
      href="https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-"
      target="_blank">how to get it</a>)
  </p>
  <input id="id" name="id" type="text" bind:value={id} />
  <p>
    url for your new clip.
    <a
      href="https://ytdl-org.github.io/youtube-dl/supportedsites.html"
      target="_blank">list of supported sites</a>
  </p>
  <input id="url" name="url" type="text" bind:value={url} />
  <div style="margin: 5px">
    <input
      type="range"
      id="volume"
      name="volume"
      min="0"
      max="1"
      step="0.1"
      bind:value={volume} />
    <label for="volume">Volume (the slider is already at a good default)</label>
  </div>
  <details style="margin: 5px">
    <summary>Start and end time (Optional)</summary>
    <div style="margin: 5px">
      <label for="startTime">Start time</label>
      <input
        type="text"
        id="startTime"
        name="startTime"
        bind:value={startTime} />
    </div>
    <div style="margin: 5px">
      <label for="endTime">End time</label>
      <input type="text" id="endTime" name="endTime" bind:value={endTime} />
    </div>
  </details>
  <p>Super secret phrase that lets you pass</p>
  <input id="phrase" name="phrase" type="password" bind:value={phrase} />
  <button on:click={submit}>Submit</button>
  <!--make type submit?-->
</form>
{#if searchPromise}
  {#await searchPromise}
    <img src="dab.gif" alt="dab" />
    <div class="msg">Processing</div>
  {:then res}
    {#if res.error}{res.error}{/if}
    {#if res.success}{res.success}{/if}
  {:catch err}
    {err}
  {/await}
{/if}
