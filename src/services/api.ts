import axios from 'axios';

const API_BASE_URL = 'https://api.example.com'; // Replace with your actual API base URL

export const fetchAppointments = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/appointments`);
        return response.data;
    } catch (error) {
        console.error('Error fetching appointments:', error);
        throw error;
    }
};

export const fetchPatients = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/patients`);
        return response.data;
    } catch (error) {
        console.error('Error fetching patients:', error);
        throw error;
    }
};

export const fetchProviders = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/providers`);
        return response.data;
    } catch (error) {
        console.error('Error fetching providers:', error);
        throw error;
    }
};

export const createAppointment = async (appointmentData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/appointments`, appointmentData);
        return response.data;
    } catch (error) {
        console.error('Error creating appointment:', error);
        throw error;
    }
};