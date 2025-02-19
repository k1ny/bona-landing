const nameInput = document.getElementById("name") as HTMLInputElement;
const phoneInput = document.getElementById("phone") as HTMLInputElement;
const mailInput = document.getElementById("mail") as HTMLInputElement;
const formButton = document.querySelector(
  ".contact-button",
) as HTMLButtonElement;

formButton.addEventListener("click", async (e) => {
  const data = {
    name: nameInput.value || null,
    phone: phoneInput.value || null,
    mail: mailInput.value || null,
  };

  e.preventDefault();
  if (!nameInput.value || !phoneInput.value || !mailInput.value)
    console.log("nope");
  else
    try {
      const response = await fetch("http://localhost:3001/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (result.success) {
        console.log("kaif");
      } else {
        console.log("not kaif");
        console.log(response);
      }
    } catch (error) {
      console.log("not kaif");
      console.log(error, "d");
    }
});
