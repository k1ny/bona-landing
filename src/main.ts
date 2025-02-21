const numberInfo = document.querySelectorAll(".statistic__item-number");

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      numberInfo.forEach((el) => {
        animateNumbers(el);
        observer.unobserve(entry.target);
      });
    }
  });
});

const animateNumbers = (el: Element) => {
  let start = 0;
  const end = el.textContent ? Number(el.textContent.replace(/[+%]/g, "")) : 0;
  const duration = 2500;
  const startTime = performance.now();

  const easeInOut = (t: number) => {
    return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
  };

  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const t = Math.min(elapsed / duration, 1);
    const easingValue = easeInOut(t);

    start = Math.floor(easingValue * end);

    el.textContent
      ? (el.textContent = start + el.textContent[el.textContent.length - 1])
      : (el.textContent = "");

    if (t < 1) {
      requestAnimationFrame(animate);
    }
  };
  requestAnimationFrame(animate);
};

observer.observe(numberInfo[0]);

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
      const response = await fetch("/api/send", {
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
