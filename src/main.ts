import { z } from "zod";
import { Cursor } from "./common/cursor";
import { Pointer } from "./common/pointer";
import { Screen } from "./common/screen";
import { Touch } from "./common/touch";
import { Swiper } from "./common/swiper";

window.addEventListener("scroll", () => {
  const header = document.querySelector(".header") as HTMLElement;
  if (window.scrollY > 60) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});

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
    return;
  } else
    try {
      formButton.disabled = true;
      const response = await fetch("/api/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (response.status === 429) {
        popup({
          type: "error",
          message: result.message,
        });
        return;
      }

      if (result.success) {
        popup({ type: "success", message: "Заявка отправлена успешно!" });
        nameInput.value = "";
        phoneInput.value = "";
      } else {
        popup({ type: "error", message: "Что-то пошло не так..." });
      }
    } catch (error) {
      popup({ type: "error", message: "Что-то пошло не так..." });
    }
  formButton.disabled = false;
});

function createSwipers(pointer: Pointer, screen: Screen) {
  const swipers: Swiper[] = [];

  document.querySelectorAll<HTMLElement>(".swiper").forEach((root) => {
    swipers.push(new Swiper(root, pointer, screen, { gap: "24px" }));
  });

  return swipers;
}

const IS_TOUCH_SUPPORTED = Boolean(
  "ontouchstart" in window || window.navigator.maxTouchPoints,
);

const pointer = IS_TOUCH_SUPPORTED ? new Touch() : new Cursor();
const screen = new Screen();

createSwipers(pointer, screen);

const flippers = document.querySelectorAll(".modal__button");

flippers.forEach(function (flipper) {
  flipper.addEventListener("click", function () {
    const card = flipper.closest(".card"); // Находим ближайшую карточку
    card?.classList.toggle("show"); // Переворачиваем только её
  });
});

document.querySelectorAll(".faq__item").forEach((el) => {
  el.addEventListener("click", () => {
    const content = el.querySelector(".accordion__description") as HTMLElement;
    const height = content.style.maxHeight;
    const plusIcon = el.querySelector(".acordion__button") as HTMLElement;

    document.querySelectorAll(".acordion__button-icon").forEach((icon) => {
      if (icon !== plusIcon) {
        icon.classList.remove("rotated");
      }
    });

    document
      .querySelectorAll(".accordion__description")
      .forEach((contentEl) => {
        const elContent = contentEl as HTMLElement;
        elContent.style.maxHeight = "";
      });

    plusIcon.classList.toggle("rotated");
    content.style.maxHeight = !height ? `${content.scrollHeight}px` : "";
  });
});
