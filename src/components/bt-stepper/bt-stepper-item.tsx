import { Component, h, Event, EventEmitter, Method, Prop } from '@stencil/core';

@Component({
  tag: 'bt-step-item',
  shadow: true,
})
export class BtStepItem {
  @Prop() loaded: boolean = false;
  @Event() asyncStart: EventEmitter<void>; // Evento cuando empieza algo asíncrono
  @Event() asyncEnd: EventEmitter<void>; // Evento cuando termina algo asíncrono

  /**
   * Método para ejecutar una tarea asíncrona.
   * Notifica al padre antes y después de la ejecución.
   */
  @Method()
  async task(cb: () => Promise<void>) {
    this.asyncStart.emit(); // Notificar al padre que inicia algo asíncrono
    try {
      await cb(); // Ejecutar la tarea proporcionada
    } finally {
      this.asyncEnd.emit(); // Notificar al padre que termina la tarea
    }
  }

  render() {
    return <slot></slot>;
  }
}
