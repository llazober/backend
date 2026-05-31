import * as signalR from '@microsoft/signalr';
import { QueryClient } from '@tanstack/react-query';

let connection: signalR.HubConnection | null = null;

export const getSignalRConnection = () => connection;

export const setupSignalR = (queryClient: QueryClient) => {
  if (connection) {
    if (connection.state === signalR.HubConnectionState.Disconnected) {
      connection.start()
        .then(() => {
          console.log('SignalR reconnected.');
          connection?.invoke('JoinBoard');
        })
        .catch((err) => console.error('SignalR Reconnect Error: ', err));
    }
    return;
  }

  const token = localStorage.getItem('qc_token');
  if (!token) return;

  const hubUrl = import.meta.env.VITE_HUB_URL || 'http://localhost:5224/qchub';

  connection = new signalR.HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory: () => localStorage.getItem('qc_token') || '',
    })
    .withAutomaticReconnect()
    .build();

  connection.onclose((error) => console.log('SignalR connection closed', error));
  connection.onreconnecting((error) => console.log('SignalR reconnecting', error));
  connection.onreconnected((connectionId) => console.log('SignalR reconnected', connectionId));

  const invalidateBoard = () => {
    queryClient.invalidateQueries({ queryKey: ['jobs'] });
    queryClient.invalidateQueries({ queryKey: ['metrics'] });
    queryClient.invalidateQueries({ queryKey: ['inspectors'] });
  };

  connection.on('JobCreated', () => {
    console.log('SignalR Event: JobCreated');
    invalidateBoard();
  });

  connection.on('JobUpdated', () => {
    console.log('SignalR Event: JobUpdated');
    invalidateBoard();
  });

  connection.on('JobMoved', () => {
    console.log('SignalR Event: JobMoved');
    invalidateBoard();
  });

  connection.on('JobAssigned', () => {
    console.log('SignalR Event: JobAssigned');
    invalidateBoard();
  });

  connection.on('JobCompleted', () => {
    console.log('SignalR Event: JobCompleted');
    invalidateBoard();
  });

  connection.on('JobDeleted', () => {
    console.log('SignalR Event: JobDeleted');
    invalidateBoard();
  });

  connection.start()
    .then(() => {
      console.log('SignalR connected.');
      connection?.invoke('JoinBoard');
    })
    .catch((err) => console.error('SignalR Connection Error: ', err));
};

export const disconnectSignalR = () => {
  if (connection) {
    connection.invoke('LeaveBoard')
      .catch((err) => console.error(err))
      .finally(() => {
        connection?.stop();
        connection = null;
      });
  }
};
