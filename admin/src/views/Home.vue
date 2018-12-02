<template>
  <div id="home">
    Home!
  </div>
</template>

<script>
export default {
  name: 'home',
  created () {
    this.$http.post('/auth').then(r => {
      if (!r.data.auth) {
        this.$router.push({ name: 'login' })
      }
    }).catch(e => {
      // eslint-disable-next-line
      console.error(e)
    })
  }
}
</script>
