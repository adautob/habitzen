
import { EventEmitter } from 'events';

// This is a simple, shared event emitter instance.
// It allows different parts of the application to communicate without
// having direct dependencies on each other. Specifically, it allows
// our data-fetching logic to signal errors to a UI-layer listener.
export const errorEmitter = new EventEmitter();
