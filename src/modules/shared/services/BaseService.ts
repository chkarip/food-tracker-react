/**
 * Base service class for all data operations
 * Provides common CRUD operations and error handling
 */
export abstract class BaseService<T> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  /**
   * Create a new document
   */
  abstract create(data: Omit<T, 'id'>): Promise<string>;

  /**
   * Get a document by ID
   */
  abstract getById(id: string): Promise<T | null>;

  /**
   * Get all documents with optional filtering
   */
  abstract getAll(filter?: Record<string, any>): Promise<T[]>;

  /**
   * Update a document
   */
  abstract update(id: string, data: Partial<T>): Promise<void>;

  /**
   * Delete a document
   */
  abstract delete(id: string): Promise<void>;

  /**
   * Handle service errors consistently
   */
  protected handleError(error: any, operation: string): never {
    console.error(`${this.collectionName} ${operation} error:`, error);
    throw new Error(`Failed to ${operation} ${this.collectionName.toLowerCase()}: ${error.message}`);
  }

  /**
   * Validate required fields
   */
  protected validateRequired(data: any, requiredFields: string[]): void {
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`${field} is required`);
      }
    }
  }
}

/**
 * Base manager class for UI components
 * Provides common state management and data operations
 */
export abstract class BaseManager<T> {
  protected service: BaseService<T>;
  protected data: T[] = [];
  protected loading: boolean = false;
  protected error: string | null = null;

  constructor(service: BaseService<T>) {
    this.service = service;
  }

  /**
   * Load all data
   */
  async loadData(filter?: Record<string, any>): Promise<T[]> {
    try {
      this.setLoading(true);
      this.setError(null);
      this.data = await this.service.getAll(filter);
      return this.data;
    } catch (error: any) {
      this.setError(error.message);
      return [];
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Create new item
   */
  async createItem(data: Omit<T, 'id'>): Promise<string | null> {
    try {
      this.setLoading(true);
      this.setError(null);
      const id = await this.service.create(data);
      await this.loadData(); // Refresh data
      return id;
    } catch (error: any) {
      this.setError(error.message);
      return null;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Update existing item
   */
  async updateItem(id: string, data: Partial<T>): Promise<boolean> {
    try {
      this.setLoading(true);
      this.setError(null);
      await this.service.update(id, data);
      await this.loadData(); // Refresh data
      return true;
    } catch (error: any) {
      this.setError(error.message);
      return false;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Delete item
   */
  async deleteItem(id: string): Promise<boolean> {
    try {
      this.setLoading(true);
      this.setError(null);
      await this.service.delete(id);
      await this.loadData(); // Refresh data
      return true;
    } catch (error: any) {
      this.setError(error.message);
      return false;
    } finally {
      this.setLoading(false);
    }
  }

  // State management methods (to be implemented by concrete classes)
  protected abstract setLoading(loading: boolean): void;
  protected abstract setError(error: string | null): void;

  // Getters
  get items(): T[] { return this.data; }
  get isLoading(): boolean { return this.loading; }
  get errorMessage(): string | null { return this.error; }
}
