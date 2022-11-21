// add a temporary hitcount to footer
fetch(
  "https://bv2d7v39v8.execute-api.ca-central-1.amazonaws.com/prod/page?page=root",
  {
    method: "POST",
  }
)
  .then((response) => response.json())
  .then((response) => {
    let footer = document.getElementById("hitcount");
    footer.innerHTML = response.hits;
  });
