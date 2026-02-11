import { rest } from 'msw';
import appointments from './appointments';
import patients from './patients';
import providers from './providers';

export const handlers = [
  rest.get('/api/appointments', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(appointments));
  }),

  rest.post('/api/appointments', (req, res, ctx) => {
    const newAppointment = req.body;
    appointments.push(newAppointment);
    return res(ctx.status(201), ctx.json(newAppointment));
  }),

  rest.get('/api/patients', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(patients));
  }),

  rest.get('/api/providers', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(providers));
  }),
];