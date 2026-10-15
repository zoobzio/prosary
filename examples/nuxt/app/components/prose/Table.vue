<template>
  <!--
    Renders every table of the content inside a scrolling box, so a wide one
    scrolls on a narrow screen instead of the page.
  -->
  <div class="table-scroll">
    <table>
      <slot />
    </table>
  </div>
</template>
