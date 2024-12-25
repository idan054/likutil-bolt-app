interface QueuedRequest {
  id: string;
  execute: () => Promise<void>;
  timestamp: number;
}

class OfflineQueue {
  private queue: QueuedRequest[] = [];
  private isProcessing = false;

  add(request: QueuedRequest) {
    this.queue.push(request);
    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessing || !navigator.onLine || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const request = this.queue[0];
      await request.execute();
      this.queue.shift(); // Remove processed request
      
      if (this.queue.length > 0) {
        await this.processQueue();
      }
    } catch (error) {
      console.error('[api.offline-queue] Failed to process request:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  clear() {
    this.queue = [];
  }
}

export const offlineQueue = new OfflineQueue();

// Start processing when coming online
window.addEventListener('online', () => {
  offlineQueue.processQueue();
});