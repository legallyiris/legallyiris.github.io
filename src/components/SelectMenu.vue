<template>
  <div class="custom-select" ref="selectContainer" role="combobox" :aria-expanded="isOpen">
    <button
      :style="{ width: icon ? 'auto' : buttonWidth }"
      :class="{ 'select-button': true, open: isOpen }"
      @click="toggleOpen"
      aria-haspopup="listbox"
      aria-controls="options-list"
      @blur="handleBlur"
    >
      <span v-if="icon" class="icon">
        <FontAwesomeIcon :icon="icon" />
      </span>
      <template v-else>
        <span>{{ selectedOption.label }}</span>
        <span class="arrow">&#9660;</span>
      </template>
    </button>
    <ul
      id="options-list"
      ref="dropdownMenu"
      role="listbox"
      class="options-list"
      @keydown.stop="handleKeyDown"
      :class="{ open: isOpen }"
      :style="{
        width: buttonWidth,
        ...dropdownPosition,
      }"
    >
      <li
        v-for="option in options"
        :key="option.value"
        @click="selectOption(option)"
        @mouseover="hoverOption(option)"
        :class="{
          selected: option.value === selectedOption.value,
          hover: activeOnHover && option.value === hoverOptionValue.value,
        }"
        role="option"
        :aria-selected="option.value === selectedOption.value"
        :tabindex="isOpen ? 0 : -1"
      >
        {{ option.label }}
      </li>
    </ul>
  </div>

  <teleport to="body">
    <div @click="toggleOpen" :class="{ backdrop: true, open: false }" />
  </teleport>
</template>

<script setup lang="ts">
import type { IconDefinition } from "@fortawesome/fontawesome-common-types";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";

interface Option {
	value: string;
	label: string;
}

const props = defineProps<{
	options: Option[];
	modelValue: string;
	activeOnHover?: boolean;
	icon?: IconDefinition | string;
}>();

const emit = defineEmits<{
	"update:modelValue": [string];
}>();

const selectContainer = ref<HTMLElement | null>(null);
const dropdownMenu = ref<HTMLElement | null>(null);
const dropdownPosition = ref({});

const isOpen = ref(false);
const buttonWidth = ref("100px");
const hoverOptionValue = ref<Option>({ value: "", label: "" });

const selectedOption = computed<Option>({
	get: () =>
		props.options.find((option) => option.value === props.modelValue) ||
		props.options[0],
	set: (newOption: Option) => emit("update:modelValue", newOption.value),
});

const selectOption = (option: Option) => {
	selectedOption.value = option;
	isOpen.value = false;
	hoverOptionValue.value = { value: "", label: "" };
};

const toggleOpen = () => {
	const opened = !isOpen.value;
	if (opened) {
		isOpen.value = opened;
		const firstItem = document.querySelector("#options-list li");
		if (firstItem) (firstItem as HTMLElement).focus();
	} else {
		isOpen.value = opened;
	}
};

const hoverOption = (option: Option) => {
	if (!props.activeOnHover) return;
	hoverOptionValue.value = option;
	selectedOption.value = option;
};

const updateDropdownPosition = () => {
	if (!selectContainer.value || !dropdownMenu.value) return;

	const containerRect = selectContainer.value.getBoundingClientRect();
	const dropdownRect = dropdownMenu.value.getBoundingClientRect();
	const viewportHeight = window.innerHeight;
	const viewportWidth = window.innerWidth;

	const spaceBelow = viewportHeight - containerRect.bottom;
	const spaceAbove = containerRect.top;
	const spaceRight = viewportWidth - containerRect.left;

	const newPosition: Record<string, string> = {};

	if (spaceBelow < dropdownRect.height && spaceAbove > dropdownRect.height) {
		newPosition.top = "auto";
		newPosition.bottom = "calc(100% + 0.5rem)";
	} else {
		newPosition.top = "calc(100% + 0.5rem)";
		newPosition.bottom = "auto";
	}

	if (containerRect.left + dropdownRect.width > viewportWidth) {
		newPosition.left = "auto";
		newPosition.right = "0";
	} else {
		newPosition.left = "0";
		newPosition.right = "auto";
	}

	dropdownPosition.value = newPosition;
};

const clickOutside = (event: MouseEvent) => {
	if (!isOpen.value) return;
	if (!selectContainer.value?.contains(event.target as Node)) {
		isOpen.value = false;
	}
};

onMounted(async () => {
	await nextTick();
	updateDropdownPosition();

	window.addEventListener("scroll", updateDropdownPosition, true);
	window.addEventListener("resize", updateDropdownPosition);
	window.addEventListener("click", clickOutside);

	const optionWidths = props.options.map((option) => {
		const testElement = document.createElement("span");
		testElement.textContent = option.label;
		document.body.appendChild(testElement);
		const width = testElement.offsetWidth + 20;
		document.body.removeChild(testElement);
		return width;
	});

	buttonWidth.value = `${Math.max(...optionWidths)}px`;
});

onUnmounted(() => {
	window.removeEventListener("scroll", updateDropdownPosition, true);
	window.removeEventListener("resize", updateDropdownPosition);
	window.removeEventListener("click", clickOutside);
});

const handleKeyDown = (event: KeyboardEvent) => {
	if (isOpen.value) {
		const listItems = document.querySelectorAll(".options-list li");
		let currentIndex = Array.from(listItems).indexOf(
			event.target as HTMLElement,
		);
		if (currentIndex === -1) return;

		if (event.key === "ArrowDown" || event.key === "ArrowUp") {
			event.preventDefault();
		}

		if (event.key === "ArrowDown") {
			currentIndex = (currentIndex + 1) % listItems.length;
		} else if (event.key === "ArrowUp") {
			currentIndex = (currentIndex - 1 + listItems.length) % listItems.length;
		} else if (event.key === "Enter" || event.key === " ") {
			(listItems[currentIndex] as HTMLElement).click();
			return;
		}
		(listItems[currentIndex] as HTMLElement).focus();
		if (props.activeOnHover) {
			hoverOption(props.options[currentIndex]);
		}
	} else if (event.key === "Enter" || event.key === " ") {
		toggleOpen();
		nextTick(() => {
			const firstItem = document.querySelector("#options-list li:first-child");
			if (!firstItem) return;
			(firstItem as HTMLElement).focus();
		});
	}
};

const handleBlur = (event: FocusEvent) => {
	if (!isOpen.value) return;
	const relatedTarget = event.relatedTarget as HTMLElement | null;
	if (!relatedTarget || !relatedTarget.closest(".options-list")) {
		isOpen.value = false;
	}
};

watch(isOpen, async (newValue) => {
	if (newValue) {
		await nextTick();
		updateDropdownPosition();
	}
});
</script>

<style scoped>
.custom-select {
  position: relative;
  display: inline-block;
  background: hsla(var(--surface0) / 0.5);
  border: 2px solid hsla(var(--text) / 0.2);
  border-radius: 50rem;
  z-index: 5;
  transition: 0.2s;

  &:hover,
  &:has(.select-button:focus-visible) {
    background: hsla(var(--surface0) / 0.7);
    border: 2px solid hsla(var(--pink) / 0.7);
  }

  &:active {
    background: hsla(var(--surface0) / 1);
    border: 2px solid hsla(var(--pink) / 1);
    scale: 0.95;
  }
}

button.select-button {
  padding: 0.25rem 0.75rem;
  background: none;
  border: none;
  color: var(--text);
  cursor: pointer;
  width: 100%;
  height: 100%;
  text-align: left;
  display: flex;
  justify-content: space-between;
  align-items: center;
  outline: none;
  font-size: 0.75rem;
}

.options-list {
  position: absolute;
  background: hsla(var(--surface0) / 1);
  border-radius: 0.5rem;
  list-style: none;
  padding: 0;
  margin: 0;
  width: 100%;
  opacity: 0;
  z-index: 1;
  overflow: hidden;
  pointer-events: none;
  user-select: none;
  transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  &.open {
    opacity: 1;
    top: calc(100% + 0.5rem);
    pointer-events: auto;
  }
}

.options-list li {
  padding: 0.25rem 0.75rem;
  cursor: pointer;
  color: hsla(var(--subtext1) / 1);
  font-size: 0.75rem;

  &.selected {
    background: hsla(var(--surface1) / 0.5);
  }

  &:hover {
    background: hsla(var(--surface1) / 0.9);
  }

  &:focus-visible {
    background: hsla(var(--surface2) / 1);
    outline: none;
  }
}

.backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backdrop-filter: brightness(0.6) blur(0.25rem);
  pointer-events: none;
  opacity: 0;
  transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  &.open {
    opacity: 1;
    pointer-events: auto;
  }
}
</style>
