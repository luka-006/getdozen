"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

const MOBILE_QUERY = "(max-width: 767px)";

export function QuestionStep({
  question,
  hint,
  children,
}: {
  question: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="oq-step oq-quiet">
      <h2 className="oq-question">{question}</h2>
      {hint ? <p className="oq-hint">{hint}</p> : null}
      <div className="oq-body">{children}</div>
    </section>
  );
}

type Field = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

function isField(node: Element): node is Field {
  return (
    node instanceof HTMLInputElement ||
    node instanceof HTMLTextAreaElement ||
    node instanceof HTMLSelectElement
  );
}

function isSkippable(field: Field) {
  if (field.disabled) return true;
  if (field instanceof HTMLInputElement) {
    return (
      field.type === "hidden" ||
      field.type === "button" ||
      field.type === "submit" ||
      field.type === "reset"
    );
  }
  return false;
}

/** Validity is checked even when a later step is off-screen. */
function findInvalid(step: HTMLElement): Field | null {
  const previous = step.style.display;
  step.style.display = "block";
  const fields = step.querySelectorAll("input, textarea, select");
  let invalid: Field | null = null;
  for (const node of fields) {
    if (!isField(node) || isSkippable(node)) continue;
    if (!node.validity.valid) {
      invalid = node;
      break;
    }
  }
  step.style.display = previous;
  return invalid;
}

function showInvalid(field: Field) {
  const rect = field.getBoundingClientRect();
  const onScreen = rect.width > 1 && rect.height > 1;
  if (!onScreen) return field.validationMessage || "Finish this step to continue.";
  field.reportValidity();
  field.focus({ preventScroll: true });
  return null;
}

export function OneQuestionFlow({
  children,
  pending,
  submitLabel = "Post request",
  error,
}: {
  children: ReactNode;
  pending: boolean;
  submitLabel?: string;
  error?: ReactNode;
}) {
  const steps = Children.toArray(children).filter(isValidElement);
  const [index, setIndex] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);
  const reactId = useId().replace(/:/g, "");
  const flowId = `oq-${reactId}`;
  const last = steps.length === 0 || index >= steps.length - 1;

  useEffect(() => {
    setIndex((current) => Math.min(current, Math.max(0, steps.length - 1)));
  }, [steps.length]);

  useEffect(() => {
    const root = document.getElementById(flowId);
    const form = root?.closest("form");
    if (!form || !root) return;

    function onSubmit(event: Event) {
      if (!window.matchMedia(MOBILE_QUERY).matches) return;
      const wrappers = root!.querySelectorAll<HTMLElement>("[data-oq-step]");
      for (let i = 0; i < wrappers.length; i++) {
        const bad = findInvalid(wrappers[i]!);
        if (!bad) continue;
        event.preventDefault();
        event.stopPropagation();
        setIndex(i);
        setStepError(bad.validationMessage || "Finish this step to continue.");
        window.setTimeout(() => {
          const message = showInvalid(bad);
          if (message) setStepError(message);
          wrappers[i]?.scrollIntoView({ block: "start" });
        }, 40);
        return;
      }
    }

    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, [flowId]);

  function stepElement(i: number) {
    return document.getElementById(`${flowId}-step-${i}`);
  }

  function goNext() {
    const step = stepElement(index);
    const inner = step?.querySelector<HTMLButtonElement>("[data-oq-inner-next]");
    if (inner && !inner.disabled) {
      inner.click();
      setStepError(null);
      return;
    }
    if (step) {
      const bad = findInvalid(step);
      if (bad) {
        const card = bad.closest("[data-q-index]");
        if (card instanceof HTMLElement && card.getBoundingClientRect().height < 1) {
          const jump = step.querySelector<HTMLButtonElement>("[data-oq-focus-question]");
          if (jump) {
            jump.dataset.index = card.dataset.qIndex ?? "";
            jump.click();
            setStepError(bad.validationMessage || "Finish this question to continue.");
            return;
          }
        }
        const message = showInvalid(bad);
        setStepError(message);
        return;
      }
    }
    setStepError(null);
    setIndex((current) => Math.min(steps.length - 1, current + 1));
  }

  function goBack() {
    const step = stepElement(index);
    const inner = step?.querySelector<HTMLButtonElement>("[data-oq-inner-prev]");
    if (inner && !inner.disabled) {
      inner.click();
      setStepError(null);
      return;
    }
    setStepError(null);
    setIndex((current) => Math.max(0, current - 1));
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter") return;
    if (!window.matchMedia(MOBILE_QUERY).matches) return;
    if (last) return;
    if (event.target instanceof HTMLTextAreaElement) return;
    event.preventDefault();
    goNext();
  }

  return (
    <div
      id={flowId}
      className="oq-flow"
      data-step={index}
      data-last={last ? "true" : "false"}
      onKeyDown={onKeyDown}
    >
      {error}
      <div className="oq-progress" aria-hidden="true">
        {steps.map((_, i) => (
          <span
            key={i}
            className={
              i === index
                ? "oq-dot oq-dot-active"
                : i < index
                  ? "oq-dot oq-dot-done"
                  : "oq-dot"
            }
          />
        ))}
      </div>
      <p className="oq-count">
        {index + 1} of {steps.length}
      </p>
      {steps.map((step, i) => (
        <div
          key={i}
          id={`${flowId}-step-${i}`}
          data-oq-step
          className={i === index ? "oq-step-wrap oq-active" : "oq-step-wrap"}
        >
          {step}
        </div>
      ))}
      {stepError ? (
        <p className="oq-step-error" role="alert">
          {stepError}
        </p>
      ) : null}
      <div className="oq-actions">
        <button type="button" className="oq-back" onClick={goBack}>
          Back
        </button>
        <button type="button" className="btn btn-primary oq-continue" onClick={goNext}>
          Continue
        </button>
        <button type="submit" className="btn btn-primary oq-submit" disabled={pending}>
          {pending ? "Posting…" : submitLabel}
        </button>
      </div>
    </div>
  );
}
