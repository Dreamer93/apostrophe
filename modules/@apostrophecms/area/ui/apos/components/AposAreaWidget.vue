
<template>
  <div
    class="apos-area-widget-wrapper"
    :class="{'apos-area-widget-wrapper--foreign': foreign}"
    :data-area-widget="widget._id"
    :data-area-label="widgetLabel"
  >
    <div
      class="apos-area-widget-inner"
      :class="ui.container"
      @mouseover="mouseover($event)"
      @mouseleave="mouseleave"
      @click="getFocus($event, widget._id)"
    >
      <div
        class="apos-area-widget-controls apos-area-widget__label"
        :class="ui.labels"
      >
        <ol class="apos-area-widget__breadcrumbs">
          <li
            v-for="item in breadcrumbs.list"
            :key="item.id"
            class="apos-area-widget__breadcrumb"
          >
            <AposButton
              type="quiet"
              @click="getFocus($event, item.id)"
              :label="item.label"
              icon="chevron-right-icon"
              :icon-size="9"
              :modifiers="['icon-right', 'no-motion']"
            />
          </li>
          <li class="apos-area-widget__breadcrumb">
            <AposButton
              type="quiet"
              @click="foreign ? $emit('edit', i) : false"
              :label="foreign ? {
                key: 'apostrophe:editWidgetType',
                label: $t(widgetLabel)
              } : widgetLabel"
              tooltip="apostrophe:editWidgetForeignTooltip"
              :icon="foreign ? 'earth-icon' : null"
              :icon-size="11"
              :modifiers="['no-motion']"
            />
          </li>
        </ol>
      </div>
      <div
        class="apos-area-widget-controls apos-area-widget-controls--add apos-area-widget-controls--add--top"
        :class="ui.addTop"
      >
        <AposAreaMenu
          v-if="!foreign"
          :max-reached="maxReached"
          @add="$emit('add', $event);"
          @menu-open="toggleMenuFocus($event, 'top', true)"
          @menu-close="toggleMenuFocus($event, 'top', false)"
          :context-menu-options="contextMenuOptions"
          :index="i"
          :widget-options="options.widgets"
          :disabled="disabled"
        />
      </div>
      <div
        class="apos-area-widget-controls apos-area-widget-controls--modify"
        :class="ui.controls"
      >
        <AposWidgetControls
          :first="i === 0"
          :last="i === next.length - 1"
          :options="{ contextual: isContextual }"
          :foreign="foreign"
          :disabled="disabled"
          :max-reached="maxReached"
          @up="$emit('up', i);"
          @remove="$emit('remove', i);"
          @edit="$emit('edit', i);"
          @cut="$emit('cut', i);"
          @copy="$emit('copy', i);"
          @clone="$emit('clone', i);"
          @down="$emit('down', i);"
        />
      </div>
      <!--
        Note: we will not need this guard layer when we implement widget controls outside of the widget DOM
        because we will be drawing and fitting a new layer ontop of the widget, which we can use to proxy event handling.
      -->
      <div
        class="apos-area-widget-guard"
        :class="{'apos-is-disabled': focused}"
      />
      <!-- Still used for contextual editing components -->
      <component
        v-if="isContextual && !foreign"
        :is="widgetEditorComponent(widget.type)"
        :value="widget"
        @update="$emit('update', $event)"
        :options="options.widgets[widget.type]"
        :type="widget.type"
        :doc-id="docId"
      />
      <component
        v-else
        :is="widgetComponent(widget.type)"
        :options="options.widgets[widget.type]"
        :type="widget.type"
        :id="widget._id"
        :area-field-id="fieldId"
        :value="widget"
        :foreign="foreign"
        @edit="$emit('edit', i);"
        :doc-id="docId"
        :rendering="rendering"
      />
      <div
        class="apos-area-widget-controls apos-area-widget-controls--add apos-area-widget-controls--add--bottom"
        :class="ui.addBottom"
      >
        <AposAreaMenu
          v-if="!foreign"
          :max-reached="maxReached"
          @add="$emit('add', $event)"
          :context-menu-options="bottomContextMenuOptions"
          :index="i + 1"
          :widget-options="options.widgets"
          :disabled="disabled"
          @menu-open="toggleMenuFocus($event, 'bottom', true)"
          @menu-close="toggleMenuFocus($event, 'bottom', false)"
        />
      </div>
    </div>
  </div>
</template>

<script>

import { klona } from 'klona';
import AposIndicator from '../../../../ui/ui/apos/components/AposIndicator.vue';

export default {
  name: 'AposAreaWidget',
  components: { AposIndicator },
  props: {
    widgetHovered: {
      type: String,
      default: null
    },
    widgetFocused: {
      type: String,
      default: null
    },
    docId: {
      type: String,
      required: false,
      default() {
        return null;
      }
    },
    i: {
      type: Number,
      required: true
    },
    options: {
      type: Object,
      default() {
        return {};
      }
    },
    widget: {
      type: Object,
      default() {
        return {};
      }
    },
    next: {
      type: Array,
      required: true
    },
    fieldId: {
      type: String,
      required: true
    },
    contextMenuOptions: {
      type: Object,
      required: true
    },
    maxReached: {
      type: Boolean
    },
    rendering: {
      type: Object,
      default() {
        return null;
      }
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  emits: [ 'clone', 'up', 'down', 'remove', 'edit', 'cut', 'copy', 'update', 'add', 'changed' ],
  data() {
    const initialState = {
      controls: {
        show: false
      },
      container: {
        highlight: false,
        focus: false
      },
      add: {
        bottom: {
          show: false,
          focus: false
        },
        top: {
          show: false,
          focus: false
        }
      },
      labels: {
        show: false
      }
    };
    return {
      blankState: klona(initialState),
      state: klona(initialState),
      highlightable: false,
      focused: false,
      classes: {
        show: 'apos-is-visible',
        open: 'apos-is-open',
        focus: 'apos-is-focused',
        highlight: 'apos-is-highlighted'
      },
      breadcrumbs: {
        $lastEl: null,
        list: []
      }
    };
  },
  computed: {
    bottomContextMenuOptions() {
      return {
        ...this.contextMenuOptions,
        menuPlacement: 'top'
      };
    },
    widgetLabel() {
      return window.apos.modules[`${this.widget.type}-widget`].label;
    },
    isContextual() {
      return this.moduleOptions.widgetIsContextual[this.widget.type];
    },
    // Browser options from the `@apostrophecms/area` module.
    moduleOptions() {
      return window.apos.area;
    },
    isSuppressed() {
      if (this.focused) {
        return false;
      }

      if (this.highlightable) {
        return false;
      }

      if (this.widgetHovered) {
        return this.widgetHovered !== this.widget._id;
      } else {
        return false;
      }
    },
    // Sets up all the interaction classes based on the current
    // state. If our widget is suppressed, return a blank UI state and reset
    // our real one.
    ui() {
      const state = {
        controls: this.state.controls.show ? this.classes.show : null,
        labels: this.state.labels.show ? this.classes.show : null,
        container: this.state.container.focus ? this.classes.focus
          : (this.state.container.highlight ? this.classes.highlight : null),
        addTop: this.state.add.top.focus ? this.classes.focus
          : (this.state.add.top.show ? this.classes.show : null),
        addBottom: this.state.add.bottom.focus ? this.classes.focus
          : (this.state.add.bottom.show ? this.classes.show : null)
      };

      if (this.isSuppressed) {
        this.resetState();
        return this.blankState;
      }

      return state;
    },
    foreign() {
      // Cast to boolean is necessary to satisfy prop typing
      return !!(this.docId && (window.apos.adminBar.contextId !== this.docId));
    }
  },
  watch: {
    widgetFocused (newVal) {
      if (newVal === this.widget._id) {
        this.focus();
      } else {
        // reset everything
        this.resetState();
        this.focused = false;
      }
      const $parent = this.getParent();
      if (
        $parent &&
        $parent.dataset.areaWidget === newVal
      ) {
        // Our parent was focused
        this.resetState();
        this.state.container.highlight = true;
        this.highlightable = true;
      } else {
        this.highlightable = false;
      }
    }
  },
  mounted() {
    // AposAreaEditor is listening for keyboard input that triggers
    // a 'focus my parent' plea
    apos.bus.$on('widget-focus-parent', this.focusParent);

    this.breadcrumbs.$lastEl = this.$el;

    if (!this.foreign) {
      this.getBreadcrumbs();
    }

    if (this.widgetFocused) {
      // If another widget was in focus (because the user clicked the "add"
      // menu, for example), and this widget was created, give the new widget
      // focus.
      apos.bus.$emit('widget-focus', this.widget._id);
    }
  },
  methods: {
    // Focus parent, useful for obtrusive UI
    focusParent() {
      // Something above us asked the focused widget to try and focus its parent
      // We only care about this if we're focused ...
      if (this.focused) {
        const $parent = this.getParent();
        // .. And have a parent
        if ($parent) {
          apos.bus.$emit('widget-focus', $parent.dataset.areaWidget);
        }
      }
    },

    // Ask the parent AposAreaEditor to make us focused
    getFocus(e, id) {
      e.stopPropagation();
      apos.bus.$emit('widget-focus', id);
    },

    // Our widget was hovered
    mouseover(e) {
      if (e) {
        e.stopPropagation();
      }
      if (this.focused) {
        return;
      }
      this.state.add.top.show = true;
      this.state.add.bottom.show = true;
      this.state.container.highlight = true;
      this.state.labels.show = true;
      apos.bus.$emit('widget-hover', this.widget._id);
    },

    mouseleave() {
      if (!this.highlightable) {
        // Force highlight when a parent has been focused
        this.state.container.highlight = false;
      }
      if (!this.focused) {
        this.state.labels.show = false;
        this.state.add.top.show = false;
        this.state.add.bottom.show = false;
      }
    },

    focus(e) {
      if (e) {
        e.stopPropagation();
      }
      this.focused = true;
      this.state.container.focus = true;
      this.state.controls.show = true;
      this.state.add.top.show = true;
      this.state.add.bottom.show = true;
      this.state.labels.show = true;
      document.addEventListener('click', this.unfocus);
    },

    unfocus(event) {
      if (!this.$el.contains(event.target)) {
        this.focused = false;
        this.resetState();
        this.highlightable = false;
        document.removeEventListener('click', this.blurUnfocus);
        apos.bus.$emit('widget-focus', null);
      }
    },

    toggleMenuFocus(event, name, value) {
      if (event) {
        event.cancelBubble = true;
      }
      this.state.add[name].focus = value;

      if (value) {
        this.focus();
      }
    },

    resetState() {
      this.state = klona(this.blankState);
    },

    getParent() {
      return apos.util.closest(this.$el.parentNode, '[data-area-widget]');
    },

    // Hacky way to get the parents tree of a widget
    // would be easier of areas/widgets were recursively calling each other and able to pass data all the way down
    getBreadcrumbs() {
      if (this.breadcrumbs.$lastEl) {
        const $parent = apos.util.closest(this.breadcrumbs.$lastEl.parentNode, '[data-area-widget]');
        if ($parent) {
          this.breadcrumbs.list.unshift({
            id: $parent.dataset.areaWidget,
            label: $parent.dataset.areaLabel
          });
          this.breadcrumbs.$lastEl = $parent;
          this.getBreadcrumbs();
        } else {
          this.breadcrumbs.$lastEl = null; // end
        }
      }
    },

    widgetComponent(type) {
      return this.moduleOptions.components.widgets[type];
    },
    widgetEditorComponent(type) {
      return this.moduleOptions.components.widgetEditors[type];
    }
  }
};
</script>

<style lang="scss" scoped>
  .apos-area-widget-guard {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .apos-area-widget-guard.apos-is-disabled {
    pointer-events: none;
  }

  .apos-area-widget-wrapper {
    position: relative;
  }

  .apos-area-widget-inner {
    position: relative;
    min-height: 50px;
    &:before, &:after {
      content: '';
      position: absolute;
      left: 0;
      width: 100%;
      height: 1px;
      border-top: 1px dashed var(--a-primary);
      opacity: 0;
      transition: opacity 0.2s ease;
      pointer-events: none;
    }

    &:before {
      top: 0;
    }
    &:after {
      bottom: 0;
    }
    &.apos-is-highlighted {
      &:before, &:after {
        opacity: 0.4;
      }
    }
    &.apos-is-focused {
      &:before, &:after {
        opacity: 1;
        border-top: 1px solid var(--a-primary);
      }
    }

    .apos-area-widget-inner &:after {
      display: none;
    }
    .apos-area-widget-inner &:before {
      z-index: $z-index-under;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      outline: 1px solid var(--a-base-1);
      outline-offset: -1px;
      background-color: var(--a-base-5);
      pointer-events: none;
    }
    .apos-area-widget-inner &.apos-is-focused:before,
    .apos-area-widget-inner &.apos-is-highlighted:before {
      z-index: $z-index-default;
    }
  }

  .apos-area-widget-inner .apos-area-widget-inner {
    &.apos-is-highlighted:before {
      opacity: 0.1;
    }
    &.apos-is-focused:before {
      opacity: 0.15;
    }
  }

  .apos-area-widget-controls {
    z-index: $z-index-widget-controls;
    position: absolute;
    opacity: 0;
    pointer-events: none;
    transition: all 0.3s ease;

    &.apos-area-widget__label {
      z-index: $z-index-widget-label;
    }
    &.apos-is-focused {
      z-index: $z-index-widget-focused-controls;
    }
  }

  // TODO commented code awaiting the triumphant return of the canvas -SR

  .apos-area-widget-controls--modify {
    right: 0;
    // transform: translate3d(calc(100% + 5px), 0, 0);
    // @media (max-width: ($a-canvas-max + 100px)) { // include extra space for tools
    // transform: translate3d(-10px, 30px, 0);
    transform: translate3d(-10px, 30px, 0);
    // }
  }

  // .apos-area-widget-inner .apos-area-widget-inner .apos-area-widget-controls--modify {
  // right: auto;
  // left: 0;
  // transform: translate3d(calc(-100% - 5px), 0, 0);
  // @media (max-width: ($a-canvas-max + 100px)) { // include extra space for tools
  // transform: translate3d(5px, 30px, 0);
  // }
  // }

  .apos-area-widget-controls--add {
    top: 0;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .apos-area-widget-controls--add--bottom {
    top: auto;
    bottom: 0;
    transform: translate(-50%, 50%);
  }

  .apos-area-widget-inner ::v-deep .apos-context-menu__popup.apos-is-visible {
    top: calc(100% + 20px);
    left: 50%;
    transform: translate(-50%, 0);
  }

  .apos-area-widget__label {
    position: absolute;
    top: 1px;
    right: 0;
    display: flex;
    transform: translateY(-100%);
  }

  .apos-area-widget-inner .apos-area-widget-inner .apos-area-widget__label {
    right: auto;
    left: 0;
  }

  .apos-area-widget__breadcrumbs {
    @include apos-list-reset();
    display: flex;
    align-items: center;
    margin: 0;
    padding: 2px;
    background-color: var(--a-background-primary);
    border: 1px solid var(--a-primary-dark-10);
  }

  .apos-area-widget-wrapper--foreign .apos-area-widget-inner .apos-area-widget__breadcrumbs {
    background-color: var(--a-primary);
    & ::v-deep .apos-button {
      color: var(--a-text-inverted);
    }
  }

  .apos-area-widget__breadcrumb,
  .apos-area-widget__breadcrumb ::v-deep .apos-button__content {
    @include type-help;
    padding: 2px;
    white-space: nowrap;
    &:hover {
      cursor: pointer;
    }
  }

  .apos-area-widget__breadcrumb--icon {
    padding: 2px;
  }

  .apos-area-widget__breadcrumb ::v-deep .apos-button {
    color: var(--a-primary-dark-10);
    &:hover, &:active, &:focus {
      text-decoration: none;
    }
  }

  .apos-is-visible,
  .apos-is-focused {
    opacity: 1;
    pointer-events: auto;
  }

</style>
