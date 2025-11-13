import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

/**
 * WebSocket Gateway for real-time marketplace events
 *
 * Events emitted:
 * - storage:listed - When storage is listed
 * - storage:purchased - When storage is purchased
 * - storage:delisted - When storage is delisted
 *
 * Clients can subscribe to specific event types or all events
 */
@WebSocketGateway({
  cors: {
    origin: '*', // Configure appropriately for production
  },
  namespace: '/marketplace-events',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);
  private readonly subscriptions = new Map<string, Set<string>>();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.subscriptions.set(client.id, new Set(['all'])); // Subscribe to all by default
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.subscriptions.delete(client.id);
  }

  /**
   * Subscribe to specific event types
   * @param eventTypes Array of event types: ['listed', 'purchased', 'delisted', 'all']
   */
  @SubscribeMessage('subscribe')
  handleSubscribe(
    @MessageBody() data: { eventTypes: string[] },
    @ConnectedSocket() client: Socket,
  ) {
    const eventTypes = data.eventTypes || ['all'];
    this.subscriptions.set(client.id, new Set(eventTypes));
    this.logger.log(
      `Client ${client.id} subscribed to: ${eventTypes.join(', ')}`,
    );
    return { success: true, subscriptions: eventTypes };
  }

  /**
   * Unsubscribe from specific event types
   */
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @MessageBody() data: { eventTypes: string[] },
    @ConnectedSocket() client: Socket,
  ) {
    const subs = this.subscriptions.get(client.id);
    if (subs) {
      data.eventTypes.forEach((type) => subs.delete(type));
      this.logger.log(
        `Client ${client.id} unsubscribed from: ${data.eventTypes.join(', ')}`,
      );
    }
    return { success: true };
  }

  /**
   * Get current subscriptions for a client
   */
  @SubscribeMessage('getSubscriptions')
  handleGetSubscriptions(@ConnectedSocket() client: Socket) {
    const subs = this.subscriptions.get(client.id);
    return { subscriptions: subs ? Array.from(subs) : [] };
  }

  /**
   * Broadcast storage listed event
   */
  broadcastStorageListed(data: any) {
    this.broadcast('storage:listed', 'listed', data);
  }

  /**
   * Broadcast storage purchased event
   */
  broadcastStoragePurchased(data: any) {
    this.broadcast('storage:purchased', 'purchased', data);
  }

  /**
   * Broadcast storage delisted event
   */
  broadcastStorageDelisted(data: any) {
    this.broadcast('storage:delisted', 'delisted', data);
  }

  /**
   * Generic broadcast helper
   */
  private broadcast(eventName: string, eventType: string, data: any) {
    // Get all connected clients
    const clients = Array.from(this.subscriptions.entries());

    // Filter clients subscribed to this event type or 'all'
    const targetClients = clients
      .filter(([_, subs]) => subs.has(eventType) || subs.has('all'))
      .map(([clientId]) => clientId);

    // Broadcast to target clients
    targetClients.forEach((clientId) => {
      this.server.to(clientId).emit(eventName, data);
    });

    this.logger.debug(
      `📡 Broadcasted ${eventName} to ${targetClients.length} clients`,
    );
  }

  /**
   * Get connection stats
   */
  getStats() {
    const totalClients = this.subscriptions.size;
    const subscriptionCounts = {
      all: 0,
      listed: 0,
      purchased: 0,
      delisted: 0,
    };

    this.subscriptions.forEach((subs) => {
      subs.forEach((sub) => {
        if (subscriptionCounts[sub] !== undefined) {
          subscriptionCounts[sub]++;
        }
      });
    });

    return {
      totalClients,
      subscriptionCounts,
    };
  }
}
