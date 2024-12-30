import { Component, Element, Event, EventEmitter, h, Method, State } from '@stencil/core';
import type { btButton } from '../bt-button/bt-button';

@Component({
  tag: 'bt-stepper',
  styleUrl: 'bt-stepper.scss',
  shadow: true,
})
export class BtStepper {
  @State() currentStep: number = 0;
  @State() completedSteps: Set<number> = new Set();
  @State() asyncAction: boolean = false;

  @Event() step: EventEmitter<number>;
  @Event() stepperEnd: EventEmitter<void>;

  @Element() el!: HTMLElement;

  private steps: HTMLElement[] = [];

  connectedCallback() {
    this.el!.addEventListener('asyncStart', this.handleAsyncStart.bind(this));
    this.el!.addEventListener('asyncEnd', this.handleAsyncEnd.bind(this));
  }

  disconnectedCallback() {
    this.el!.removeEventListener('asyncStart', this.handleAsyncStart.bind(this));
    this.el!.removeEventListener('asyncEnd', this.handleAsyncEnd.bind(this));
  }
  componentWillLoad() {
    this.initializeSteps();
  }

  componentDidLoad() {
    this.updateStep();
    this.step.emit(this.currentStep);
  }

  @Method()
  async setStep(index: number) {
    if (typeof index !== 'number') return;
    this.goToStep(index);
  }

  /**
   * Initializes the steps in the stepper component.
   *
   * This function selects all 'bt-step-item' elements within the component,
   * stores them in the `steps` array, assigns each step a unique `data-index`
   * attribute based on its position, and hides all steps by setting their
   * display style to 'none'.
   */
  private initializeSteps() {
    this.steps = Array.from(this.el.querySelectorAll('bt-step-item'));
    this.steps.forEach((step, index) => {
      step.setAttribute('data-index', index.toString());
      step.style.display = 'none';
    });
  }

  /**
   * Updates the stepper component to reflect the current step.
   *
   * This function updates the visibility of the steps by setting the display property to
   * either "block" or "none" depending on whether the step is the current step or not.
   * It also updates the state of the indicators by toggling the "active" and "completed"
   * classes. The "active" class is set if the indicator is the current step, and the
   * "completed" class is set if the indicator is before the current step. The function
   * also sets the tabindex and disabled properties of the indicators to either 0 or -1
   * depending on whether the indicator is completed or not.
   */
  private updateStep() {
    this.steps.forEach((step, index) => {
      step.style.display = index === this.currentStep ? 'block' : 'none';
    });

    const indicators = this.el.shadowRoot?.querySelectorAll('.indicator') || [];
    indicators.forEach((indicator: HTMLElement, index) => {
      indicator.classList.toggle('active', index === this.currentStep);
      indicator.classList.toggle('completed', index < this.currentStep);
      if (indicator.classList.contains('completed') || index === this.currentStep) {
        indicator.setAttribute('tabindex', '0');
        indicator.removeAttribute('disabled');
      } else {
        indicator.setAttribute('tabindex', '-1');
        indicator.setAttribute('disabled', 'true');
      }
    });
    const nextButton = this.el.shadowRoot?.querySelector('#next') as unknown as btButton;
    const prevButton = this.el.shadowRoot?.querySelector('#prev') as unknown as btButton;
    if (nextButton) {
      nextButton.disabled = !this.isStepValid(this.currentStep);
    }
    if (prevButton) {
      prevButton.disabled = this.currentStep === 0;
    }
  }

  @Method()
  async setStepValidity(index: number, isValid: boolean) {
    const step = this.steps[index];
    step.setAttribute('data-valid', isValid ? 'true' : 'false');
    this.updateStep();
  }

  /**
   * Checks if a step is valid.
   *
   * A step is valid if it has a "data-valid" attribute that is either empty or set to "true".
   * @param index The index of the step to check.
   * @returns True if the step is valid, false otherwise.
   */
  private isStepValid(index: number): boolean {
    const step = this.steps[index];
    const validData = step.getAttribute('data-valid');
    return !validData || validData === 'true';
  }

  /**
   * Changes the current step by the given direction.
   *
   * If the current step is invalid, it will not change the step and log a warning.
   * If the new step is out of range, it will not change the step.
   * @param direction The direction to change the step, 1 is forward and -1 is backward.
   */
  private changeStep(direction: number) {
    //check stepvalidity on current step only for next step
    if (direction === 1 && !this.isStepValid(this.currentStep)) {
      console.warn(`Step ${this.currentStep} is invalid.`);
      return;
    }

    const newStep = this.currentStep + direction;
    if (newStep >= 0 && newStep < this.steps.length) {
      this.completeStep(this.currentStep);
      this.currentStep = newStep;
      this.updateStep();
    }
    this.step.emit(this.currentStep);
  }

  /**
   * Navigates to a specific step in the stepper.
   *
   * This function sets the current step to the specified index and updates the
   * stepper's state to reflect the change. It ensures that the provided index
   * is within the valid range of steps before performing the update.
   *
   * @param index The index of the step to navigate to.
   */
  private goToStep(index: number) {
    if (index >= 0 && index < this.steps.length) {
      this.currentStep = index;
      this.updateStep();
    }
  }

  /**
   * Completes a step by adding it to the set of completed steps.
   * @param index The index of the step to complete.
   */
  private completeStep(index: number) {
    if (index >= 0 && index < this.steps.length) {
      this.completedSteps.add(index);
    }
  }

  /**
   * Renders the step indicators at the top of the component.
   *
   * This function renders a list of buttons where each button represents a step in the
   * stepper. The button is given a class of "indicator" and an extra class of "active" if
   * the button represents the current step. A class of "completed" is also added if the
   * step has been completed. The "data-index" attribute is set to the index of the step
   * so that it can be accessed when the button is clicked. The button is also given an
   * onClick event handler that calls the "goToStep" function with the index of the step
   * when clicked.
   */
  private renderIndicators() {
    return (
      <div id="indicators">
        {this.steps.map((_, index) => (
          <button
            class={{
              indicator: true,
              active: index === this.currentStep,
              completed: index < this.currentStep,
            }}
            data-index={index}
            onClick={() => this.goToStep(index)}
          >
            {index + 1}
          </button>
        ))}
      </div>
    );
  }

  private handleAsyncStart() {
    this.asyncAction = true;
  }
  private handleAsyncEnd() {
    this.asyncAction = false;
  }
  private handleStepperEnd() {
    this.stepperEnd.emit();
  }

  render() {
    return (
      <section>
        
        
        <div id="controls">
          <bt-button id="prev" hideText loading={this.asyncAction} disabled={this.currentStep === 0} onClick={() => this.changeStep(-1)}>
            <svg
              slot="icon-left"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="icon"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M5 12l14 0" />
              <path d="M5 12l4 4" />
              <path d="M5 12l4 -4" />
            </svg>
            Back
          </bt-button>
          {this.renderIndicators()}
          {this.currentStep < this.steps.length - 1 && (
            <bt-button
              id="next"
              loading={this.asyncAction}
              hideText
              disabled={!this.isStepValid(this.currentStep)}
              onClick={() => this.changeStep(1)}
            >
              Next{' '}
              <svg
                slot="icon-right"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="icon"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M5 12l14 0" />
                <path d="M15 16l4 -4" />
                <path d="M15 8l4 4" />
              </svg>
            </bt-button>
          )}
          {this.currentStep === this.steps.length - 1 && (
            <bt-button id="finish" hideText success loading={this.asyncAction} disabled={!this.isStepValid(this.currentStep) || this.currentStep !== this.steps.length - 1} onClick={() => this.handleStepperEnd()}>
              Finish{' '}
              <svg
                slot="icon-right"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="icon"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M5 12l5 5l10 -10" />
              </svg>
            </bt-button>
          )}
        </div>
        <div class="content">
          <slot></slot>
        </div>
      </section>
    );
  }
}
