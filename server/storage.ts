import { 
  users, licenses, accountVerifications, 
  type User, type InsertUser, 
  type License, type InsertLicense, 
  type LicenseVerifyRequest,
  type AccountVerification,
  type InsertAccountVerification,
  type AccountVerificationResponse
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // License methods
  createLicense(license: InsertLicense): Promise<License>;
  getLicense(id: number): Promise<License | undefined>;
  getLicenseByKey(licenseKey: string): Promise<License | undefined>;
  verifyLicense(verifyData: LicenseVerifyRequest): Promise<{ 
    valid: boolean; 
    message: string; 
    licenseData?: License;
  }>;
  getAllActiveLicenses(): Promise<License[]>;
  
  // Account verification methods
  createAccountVerification(data: InsertAccountVerification): Promise<AccountVerification>;
  getAccountVerification(id: number): Promise<AccountVerification | undefined>;
  getAccountVerificationByUserId(jalwaUserId: string): Promise<AccountVerification | undefined>;
  updateAccountVerificationStatus(id: number, status: string, notes?: string): Promise<AccountVerification | undefined>;
  getAllAccountVerifications(): Promise<AccountVerification[]>;
  getAccountVerificationsByStatus(status: string): Promise<AccountVerification[]>;
  verifyJalwaAccount(jalwaUserId: string): Promise<AccountVerificationResponse>;
  
  // Gift code methods
  getGiftCode(): Promise<string>;
  updateGiftCode(newCode: string): Promise<string>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private licenses: Map<number, License>;
  private accountVerifications: Map<number, AccountVerification>;
  private giftCode: string = "4033F8A7A14DE9DC179CDD9942EF52F6";
  userCurrentId: number;
  licenseCurrentId: number;
  accountVerificationCurrentId: number;
  
  // Store last seen verification state to ensure we can recover after restarts
  private static persistedVerifications: AccountVerification[] = [];
  
  // Some demo license keys for testing
  private demoLicenseKeys: Record<string, { gameType: 'wingo' | 'trx', timeOptions: string[] }> = {
    'USER2025': { gameType: 'wingo', timeOptions: ['30 SEC', '1 MIN', '3 MIN'] },
    'USERVIP': { gameType: 'trx', timeOptions: ['1 MIN'] },
    'USERPRO': { gameType: 'wingo', timeOptions: ['30 SEC', '1 MIN', '3 MIN', '5 MIN'] }
  };
  
  // Approved Jalwa user IDs (these would be manually approved via Telegram bot)
  private approvedUserIds: string[] = ['12345', '56789', 'admin123', 'approved_test_user'];

  constructor() {
    this.users = new Map();
    this.licenses = new Map();
    this.accountVerifications = new Map();
    this.userCurrentId = 1;
    this.licenseCurrentId = 1;
    this.accountVerificationCurrentId = 1;
    
    // Initialize with some demo licenses
    const now = new Date();
    const oneYearLater = new Date(now);
    oneYearLater.setFullYear(now.getFullYear() + 1);
    
    // Create demo licenses
    Object.entries(this.demoLicenseKeys).forEach(([key, info], index) => {
      const license: License = {
        id: this.licenseCurrentId++,
        licenseKey: key,
        userId: null,
        gameType: info.gameType,
        timeOption: info.timeOptions.join(','),
        createdAt: now,
        expiresAt: oneYearLater,
        isActive: true
      };
      
      this.licenses.set(license.id, license);
    });
    
    // Initialize with some demo account verifications
    this.approvedUserIds.forEach(userId => {
      const verification: AccountVerification = {
        id: this.accountVerificationCurrentId++,
        jalwaUserId: userId,
        status: 'approved',
        createdAt: now,
        updatedAt: now,
        notes: 'Pre-approved user'
      };
      
      this.accountVerifications.set(verification.id, verification);
      MemStorage.persistedVerifications.push(verification);
    });
    
    // Restore any persisted verifications from previous sessions
    if (MemStorage.persistedVerifications.length > 0) {
      console.log(`Restoring ${MemStorage.persistedVerifications.length} persisted verifications from previous session`);
      MemStorage.persistedVerifications.forEach(verification => {
        // Skip if already in our collection (from demo data)
        if (!this.accountVerifications.has(verification.id)) {
          this.accountVerifications.set(verification.id, verification);
          
          // Update current ID counter if needed
          if (verification.id >= this.accountVerificationCurrentId) {
            this.accountVerificationCurrentId = verification.id + 1;
          }
        }
      });
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async createLicense(insertLicense: InsertLicense): Promise<License> {
    const id = this.licenseCurrentId++;
    const now = new Date();
    const license: License = { 
      id,
      licenseKey: insertLicense.licenseKey,
      userId: insertLicense.userId === undefined ? null : insertLicense.userId,
      gameType: insertLicense.gameType,
      timeOption: insertLicense.timeOption,
      expiresAt: insertLicense.expiresAt,
      isActive: insertLicense.isActive ?? true,
      createdAt: now
    };
    this.licenses.set(id, license);
    return license;
  }
  
  async getLicense(id: number): Promise<License | undefined> {
    return this.licenses.get(id);
  }
  
  async getLicenseByKey(licenseKey: string): Promise<License | undefined> {
    return Array.from(this.licenses.values()).find(
      (license) => license.licenseKey === licenseKey,
    );
  }
  
  async verifyLicense(verifyData: LicenseVerifyRequest): Promise<{ 
    valid: boolean; 
    message: string; 
    licenseData?: License;
  }> {
    const { licenseKey, gameType, timeOption } = verifyData;
    
    // Find the license by key
    const license = await this.getLicenseByKey(licenseKey);
    
    // If license doesn't exist
    if (!license) {
      return { 
        valid: false, 
        message: 'Invalid license key' 
      };
    }
    
    // Check if license is active
    if (!license.isActive) {
      return { 
        valid: false, 
        message: 'License is inactive or has been revoked' 
      };
    }
    
    // Check if license has expired
    const now = new Date();
    if (license.expiresAt < now) {
      return { 
        valid: false, 
        message: 'License has expired' 
      };
    }
    
    // Special case: USERPRO works for both WinGo and TRX Hash
    if (license.licenseKey === 'USERPRO') {
      // USERPRO works for both game types, no need to check game type
    } 
    // For other licenses, check if game type matches
    else if (license.gameType !== gameType) {
      return { 
        valid: false, 
        message: `This license is for ${license.gameType.toUpperCase()} game, not for ${gameType.toUpperCase()}` 
      };
    }
    
    // Check if time option is valid for this license
    const timeOptions = license.timeOption.split(',');
    
    // Special case for USERPRO - additional support for TRX time options
    if (license.licenseKey === 'USERPRO') {
      // For USERPRO, allow all time options in both game types
      const allTimeOptions = ['30 SEC', '1 MIN', '3 MIN', '5 MIN'];
      if (!allTimeOptions.includes(timeOption)) {
        return { 
          valid: false, 
          message: `This license doesn't support the ${timeOption} time option` 
        };
      }
    }
    // For other licenses, check normally
    else if (!timeOptions.includes(timeOption)) {
      return { 
        valid: false, 
        message: `This license doesn't support the ${timeOption} time option` 
      };
    }
    
    // All checks passed
    return { 
      valid: true, 
      message: 'License verified successfully', 
      licenseData: license 
    };
  }
  
  async getAllActiveLicenses(): Promise<License[]> {
    const now = new Date();
    return Array.from(this.licenses.values()).filter(
      (license) => license.isActive && license.expiresAt > now
    );
  }
  
  // Account verification methods implementation
  async createAccountVerification(data: InsertAccountVerification): Promise<AccountVerification> {
    const id = this.accountVerificationCurrentId++;
    const now = new Date();
    
    const verification: AccountVerification = {
      id,
      jalwaUserId: data.jalwaUserId,
      status: data.status || 'pending',
      createdAt: now,
      updatedAt: now,
      notes: data.notes || null
    };
    
    this.accountVerifications.set(id, verification);
    
    // Save to persisted storage for restarts
    MemStorage.persistedVerifications.push(verification);
    
    return verification;
  }
  
  async getAccountVerification(id: number): Promise<AccountVerification | undefined> {
    // First check our in-memory collection
    const verification = this.accountVerifications.get(id);
    
    // If not found, check persisted storage
    if (!verification) {
      const persisted = MemStorage.persistedVerifications.find(v => v.id === id);
      if (persisted) {
        // Restore from persisted storage
        this.accountVerifications.set(id, persisted);
        
        // Update current ID if needed
        if (id >= this.accountVerificationCurrentId) {
          this.accountVerificationCurrentId = id + 1;
        }
        
        return persisted;
      }
    }
    
    return verification;
  }
  
  async getAccountVerificationByUserId(jalwaUserId: string): Promise<AccountVerification | undefined> {
    return Array.from(this.accountVerifications.values()).find(
      (verification) => verification.jalwaUserId === jalwaUserId
    );
  }
  
  async updateAccountVerificationStatus(id: number, status: string, notes?: string): Promise<AccountVerification | undefined> {
    // First check in our in-memory collection
    let verification = await this.getAccountVerification(id);
    
    // If not found in primary storage, try to find in persisted storage
    if (!verification) {
      const persisted = MemStorage.persistedVerifications.find(v => v.id === id);
      if (persisted) {
        // Restore from persisted storage
        verification = persisted;
        this.accountVerifications.set(id, persisted);
        
        // Update the current ID if needed
        if (id >= this.accountVerificationCurrentId) {
          this.accountVerificationCurrentId = id + 1;
        }
      } else {
        return undefined;
      }
    }
    
    const updatedVerification: AccountVerification = {
      ...verification,
      status,
      updatedAt: new Date(),
      notes: notes !== undefined ? notes : verification.notes
    };
    
    this.accountVerifications.set(id, updatedVerification);
    
    // Update in our persisted storage too
    const index = MemStorage.persistedVerifications.findIndex(v => v.id === id);
    if (index >= 0) {
      MemStorage.persistedVerifications[index] = updatedVerification;
    } else {
      MemStorage.persistedVerifications.push(updatedVerification);
    }
    
    return updatedVerification;
  }
  
  async getAllAccountVerifications(): Promise<AccountVerification[]> {
    return Array.from(this.accountVerifications.values());
  }
  
  async getAccountVerificationsByStatus(status: string): Promise<AccountVerification[]> {
    return Array.from(this.accountVerifications.values()).filter(
      (verification) => verification.status === status
    );
  }
  
  async verifyJalwaAccount(jalwaUserId: string): Promise<AccountVerificationResponse> {
    // First check if this user ID is already in our system
    const existingVerification = await this.getAccountVerificationByUserId(jalwaUserId);
    
    if (existingVerification) {
      // Return status based on the existing verification
      if (existingVerification.status === 'approved') {
        return {
          success: true,
          message: 'Account verified successfully',
          isVerified: true,
          userId: jalwaUserId,
          status: 'approved'
        };
      } else if (existingVerification.status === 'rejected') {
        return {
          success: false,
          message: 'This account has been rejected. Please contact support.',
          isVerified: false,
          userId: jalwaUserId,
          status: 'rejected'
        };
      } else {
        return {
          success: false,
          message: 'Your account is pending verification. Please try again later.',
          isVerified: false,
          userId: jalwaUserId,
          status: 'pending'
        };
      }
    }
    
    // If this is a new verification, create it with pending status
    const newVerification = await this.createAccountVerification({
      jalwaUserId,
      status: 'pending',
      notes: 'Submitted via app'
    });
    
    // Automatically approve the verification after 2 seconds
    setTimeout(async () => {
      try {
        await this.updateAccountVerificationStatus(
          newVerification.id,
          'approved',
          'Auto-approved by system'
        );
        console.log(`✅ Auto-approved verification ID: ${newVerification.id} for user: ${jalwaUserId}`);
      } catch (error) {
        console.error(`❌ Error auto-approving verification: ${error}`);
      }
    }, 2000);
    
    return {
      success: true,
      message: 'Account submitted for verification. Please wait for approval.',
      isVerified: false,
      userId: jalwaUserId,
      status: 'pending'
    };
  }
  
  // Gift Code methods
  async getGiftCode(): Promise<string> {
    return this.giftCode;
  }
  
  async updateGiftCode(newCode: string): Promise<string> {
    // Update gift code
    this.giftCode = newCode;
    console.log(`Gift code updated to: ${newCode}`);
    return this.giftCode;
  }
}

export const storage = new MemStorage();
