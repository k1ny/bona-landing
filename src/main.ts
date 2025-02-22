import { z } from "zod";

const number = document.querySelectorAll(".statistic__item-number");
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      number.forEach((el) => {
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

observer.observe(number[0]);

const nameInput = document.getElementById("name") as HTMLInputElement;
const phoneInput = document.getElementById("phone") as HTMLInputElement;
const timeInput = document.getElementById("time") as HTMLInputElement;
const formButton = document.querySelector(
  ".contact-button",
) as HTMLButtonElement;

phoneInput.addEventListener("input", (e: Event) => {
  const target = e.target as HTMLInputElement;

  let rawValue = target.value.replace(/\D/g, "");

  if (!rawValue.startsWith("7")) {
    rawValue = "7" + rawValue;
  }

  let x = rawValue.match(/(\d{1})(\d{0,3})(\d{0,3})(\d{0,4})/);

  if (x) {
    target.value =
      "+7" +
      (x[2] ? " (" + x[2] + ") " : "") +
      (x[3] ? x[3] : "") +
      (x[4] ? "-" + x[4] : "");
  }
});

const popup = ({
  type,
  message,
}: {
  type: "success" | "error";
  message: string;
}) => {
  const container = document.querySelector(".notifications")!;
  const template =
    document.querySelector<HTMLTemplateElement>("#notification")!;
  const element = template.content.firstElementChild!.cloneNode(
    true,
  ) as HTMLElement;

  element.querySelector(".notification__status")!.textContent = {
    success: "Успех!",
    error: "Ошибка!",
  }[type];
  element.querySelector(".notification__reason")!.textContent = message;

  element
    .querySelector(".notification__close")!
    .addEventListener("click", () => {
      element.remove();
    });

  setTimeout(() => {
    element.remove();
  }, 5000);

  container.append(element);
};

formButton.addEventListener("click", async (e) => {
  e.preventDefault();

  const data = {
    name: nameInput.value || null,
    phone: phoneInput.value || null,
    time: timeInput.value || null,
  };

  const nameSchema = z.string().max(32);
  const phoneSchema = z.string().length(17);

  const nameResult = nameSchema.safeParse(data.name);
  const phoneResult = phoneSchema.safeParse(data.phone);

  if (!data.name || !data.phone) {
    popup({ type: "error", message: "Заполните все поля!" });
    return;
  }
  if (!nameResult.success) {
    popup({ type: "error", message: "Cлишком длинное имя!" });
    return;
  }
  if (!phoneResult.success) {
    popup({ type: "error", message: "Заполните номер полностью!" });
    console.log(phoneInput.value);
    return;
  } else
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
        popup({ type: "success", message: "Заявка отправлена успешно!" });
      } else {
        popup({ type: "error", message: "Что-то пошло не так..." });
      }
    } catch (error) {
      popup({ type: "error", message: "Что-то пошло не так..." });
    }
});
