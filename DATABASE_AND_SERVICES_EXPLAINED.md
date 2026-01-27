# 🗄️ DATABASE STRUCTURE & SERVICES EXPLAINED

## 📊 Database Architecture

### Technology Stack
- **Database**: PostgreSQL (Production-grade relational database)
- **ORM**: Prisma (Type-safe database client with migrations)
- **Hosting**: Render Managed PostgreSQL
- **Connection**: Connection pooling for performance

### Database Schema Overview

The Smart Link Hub uses a **relational database design** with 5 core tables that work together to provide intelligent link management.

## 🏗️ Database Tables Breakdown

### 1. **Users Table** 👤
```sql
CREATE TABLE users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  display_name VARCHAR,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);
```

**Purpose**: Manages user accounts and authentication
**Key Features**:
- **UUID Primary Key**: Secure, non-sequential user IDs
- **Unique Email**: Prevents duplicate accounts
- **Password Hash**: bcrypt-hashed passwords (never store plain text)
- **Display Name**: Optional user-friendly name
- **Timestamps**: Track account creation and updates

**Relationships**:
- One user can have many hubs (1:N)

### 2. **Hubs Table** 🏠
```sql
CREATE TABLE hubs (
  id         SERIAL PRIMARY KEY,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  slug       VARCHAR UNIQUE NOT NULL,
  title      VARCHAR NOT NULL,
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_hubs_user_id ON hubs(user_id);
CREATE INDEX idx_hubs_slug ON hubs(slug);
```

**Purpose**: Represents link collections (like "My Social Links", "Business Links")
**Key Features**:
- **Integer ID**: Fast lookups and joins
- **Unique Slug**: Public URL identifier (e.g., "my-links" → `/h/my-links`)
- **User Ownership**: Each hub belongs to one user
- **Activation**: Can be enabled/disabled
- **Cascade Delete**: When user is deleted, all their hubs are deleted

**Relationships**:
- Belongs to one user (N:1)
- Has many links (1:N)
- Has many analytics records (1:N)

### 3. **Links Table** 🔗
```sql
CREATE TABLE links (
  id             SERIAL PRIMARY KEY,
  hub_id         INTEGER REFERENCES hubs(id) ON DELETE CASCADE,
  url            VARCHAR NOT NULL,
  title          VARCHAR NOT NULL,
  is_active      BOOLEAN DEFAULT TRUE,
  priority_score INTEGER DEFAULT 0,
  created_at     TIMESTAMP DEFAULT NOW(),
  updated_at     TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_links_hub_id ON links(hub_id);
```

**Purpose**: Individual links within a hub
**Key Features**:
- **Hub Association**: Each link belongs to one hub
- **URL & Title**: The actual link destination and display name
- **Priority Score**: Higher numbers appear first (manual ordering)
- **Activation**: Individual links can be enabled/disabled
- **Cascade Delete**: When hub is deleted, all its links are deleted

**Relationships**:
- Belongs to one hub (N:1)
- Has many rules (1:N)
- Has many analytics records (1:N)

### 4. **Rules Table** ⚙️
```sql
CREATE TABLE rules (
  id         SERIAL PRIMARY KEY,
  link_id    INTEGER REFERENCES links(id) ON DELETE CASCADE,
  type       VARCHAR NOT NULL, -- 'time', 'device', 'geo', 'performance'
  value      JSONB NOT NULL,   -- Flexible rule configuration
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rules_link_id ON rules(link_id);
```

**Purpose**: Conditional display rules for links
**Key Features**:
- **Flexible JSON Storage**: Each rule type has different configuration
- **Rule Types**: time, device, geo, performance
- **Link Association**: Rules belong to specific links
- **Cascade Delete**: When link is deleted, all its rules are deleted

**Rule Types & JSON Structure**:

#### Time Rules
```json
{
  "start": "09:00",     // Show after 9 AM
  "end": "17:00",       // Hide after 5 PM
  "days": [1,2,3,4,5]   // Monday-Friday only (0=Sunday, 6=Saturday)
}
```

#### Device Rules
```json
{
  "allowed": ["mobile", "desktop"],  // Show only on these devices
  "priority": "mobile"               // Boost priority for mobile users
}
```

#### Geo Rules
```json
{
  "allowed": ["US", "CA", "GB"],     // Show only in these countries
  "blocked": ["CN", "RU"],           // Never show in these countries
  "priority": "US"                   // Boost priority for US users
}
```

#### Performance Rules
```json
{
  "minClicks": 10,      // Only show if link has 10+ clicks
  "autoSort": true      // Automatically boost high-performing links
}
```

**Relationships**:
- Belongs to one link (N:1)

### 5. **Analytics Table** 📈
```sql
CREATE TABLE analytics (
  id        SERIAL PRIMARY KEY,
  link_id   INTEGER REFERENCES links(id) ON DELETE SET NULL,
  hub_id    INTEGER REFERENCES hubs(id) ON DELETE SET NULL,
  device    VARCHAR NOT NULL,
  country   VARCHAR NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_analytics_link_id ON analytics(link_id);
CREATE INDEX idx_analytics_hub_id ON analytics(hub_id);
CREATE INDEX idx_analytics_timestamp ON analytics(timestamp);
```

**Purpose**: Track visits and clicks for analytics
**Key Features**:
- **Dual Tracking**: Records both hub visits and link clicks
- **Device Detection**: mobile, desktop, tablet, unknown
- **Geographic Data**: Country codes from GeoIP
- **Timestamp**: When the event occurred
- **Nullable References**: SET NULL on delete (preserve analytics data)

**Event Types**:
- **Hub Visit**: `hub_id` set, `link_id` is NULL
- **Link Click**: Both `hub_id` and `link_id` set

**Relationships**:
- Optionally belongs to one hub (N:1)
- Optionally belongs to one link (N:1)

## 🔄 Database Relationships Diagram

```
User (1) ──────┐
               │
               ▼
             Hub (N) ──────┐
               │           │
               ▼           ▼
            Link (N)   Analytics (N)
               │           ▲
               ▼           │
            Rule (N) ──────┘
               │
               ▼
          Analytics (N)
```

## 🛠️ Services Architecture

### 1. **Authentication Service** 🔐
**File**: `backend/src/services/authService.ts`

**Responsibilities**:
- User registration with email validation
- Password hashing using bcrypt (12 salt rounds)
- User login with credential verification
- JWT token generation and management

**Key Methods**:
```typescript
async register(data: RegisterData): Promise<AuthResponse>
async login(data: LoginData): Promise<AuthResponse>
private generateToken(userId: string): string
```

**Security Features**:
- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Tokens**: Secure, stateless authentication
- **Email Uniqueness**: Prevents duplicate accounts
- **Input Validation**: Validates email format and password strength

### 2. **Resolver Service** 🎯
**File**: `backend/src/services/resolverService.ts`

**Responsibilities**:
- Resolve public hub URLs (`/h/slug`)
- Apply conditional rules to filter links
- Track hub visits in analytics
- Return filtered and sorted links

**Key Methods**:
```typescript
async resolve(slug: string, context: RequestContext): Promise<ResolverResponse>
private trackVisit(hubId: number, context: RequestContext): Promise<void>
```

**Process Flow**:
1. **Slug Lookup**: Find hub by slug (case-insensitive)
2. **Hub Validation**: Check if hub exists and is active
3. **Visit Tracking**: Log hub visit in analytics
4. **Link Retrieval**: Get all active links with rules and analytics
5. **Rules Processing**: Apply conditional rules via Rules Engine
6. **Sorting**: Order links by priority and performance
7. **Response**: Return hub info and filtered links

### 3. **Rules Engine Service** ⚙️
**File**: `backend/src/services/rulesEngine.ts`

**Responsibilities**:
- Evaluate conditional rules for each link
- Filter links based on visitor context
- Calculate dynamic priority scores
- Sort links by computed priority

**Key Functions**:
```typescript
shouldShowLink(link: LinkWithRules, context: RequestContext): boolean
calculateLinkPriority(link: LinkWithRules, context: RequestContext): number
sortLinksByRules(links: LinkWithRules[], context: RequestContext): LinkWithRules[]
```

**Rule Evaluation Logic**:

#### Time Rules
- Check current time against start/end times
- Validate day of week (0=Sunday, 6=Saturday)
- Support business hours, event schedules

#### Device Rules
- Match visitor device type (mobile/desktop/tablet)
- Allow targeting specific devices
- Boost priority for preferred devices

#### Geo Rules
- Match visitor country via GeoIP
- Support allow/block lists
- Handle VPN/localhost gracefully
- Boost priority for target countries

#### Performance Rules
- Check minimum click thresholds
- Auto-boost high-performing links
- Dynamic sorting based on analytics

**Default Behavior**:
- **No Rules**: Link always shows (maximum accessibility)
- **Multiple Rules**: ALL rules must pass (AND logic)
- **Rule Failure**: Link is hidden for that visitor

### 4. **Context Detector Service** 🌍
**File**: `backend/src/utils/contextDetector.ts`

**Responsibilities**:
- Detect visitor device type from User-Agent
- Determine geographic location from IP address
- Handle proxy/VPN scenarios gracefully
- Provide context for rules evaluation

**Key Functions**:
```typescript
detectContext(req: Request): Promise<RequestContext>
detectCountry(ipAddress: string): Promise<string | undefined>
```

**Detection Methods**:

#### Device Detection
- **Library**: UAParser.js
- **Sources**: User-Agent header analysis
- **Types**: mobile, desktop, tablet, unknown
- **Fallback**: OS-based detection for unknown devices

#### Geographic Detection
- **Service**: ipapi.co GeoIP API
- **Timeout**: 3-second timeout for reliability
- **Fallback**: 'IN' (India) for localhost/VPN
- **Error Handling**: Graceful degradation on API failures

**IP Address Resolution**:
```typescript
const ipAddress = 
  req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||  // Proxy
  req.headers['x-real-ip'] ||                               // Load balancer
  req.socket.remoteAddress ||                               // Direct connection
  undefined;
```

## 🔄 External Services Integration

### 1. **GeoIP Service (ipapi.co)** 🌍
**Purpose**: Convert IP addresses to country codes
**Usage**: Geographic targeting rules
**Features**:
- Free tier: 1,000 requests/day
- Reliable country detection
- JSON API response
- Timeout handling (3 seconds)

**API Call Example**:
```typescript
const response = await fetch(`https://ipapi.co/${ipAddress}/json/`, {
  signal: controller.signal,
  headers: { 'User-Agent': 'Smart-Link-Hub/1.0' }
});
```

**Response Format**:
```json
{
  "country_code": "US",
  "country_name": "United States",
  "city": "New York",
  "region": "New York"
}
```

### 2. **QR Code Generation** 📱
**Library**: Built-in Node.js QR code generation
**Purpose**: Generate QR codes for hub URLs
**Usage**: Easy mobile sharing
**Features**:
- SVG format for scalability
- Customizable size and error correction
- Embedded in API responses

### 3. **JWT Authentication** 🔑
**Library**: jsonwebtoken
**Purpose**: Stateless authentication
**Features**:
- Configurable expiration (default: 7 days)
- Secure secret key
- Payload contains user ID only

**Token Structure**:
```json
{
  "userId": "uuid-string",
  "iat": 1640995200,
  "exp": 1641600000
}
```

## 📊 Data Flow Examples

### 1. **Public Hub Visit Flow**
```
1. User visits: https://app.com/h/my-links
2. Frontend extracts slug: "my-links"
3. API call: GET /api/resolve/my-links
4. Context Detection:
   - Device: mobile (from User-Agent)
   - Country: US (from IP via ipapi.co)
   - Time: 2024-01-26 14:30:00
5. Database Query:
   - Find hub with slug "my-links"
   - Get all active links with rules
6. Rules Engine:
   - Link 1: No rules → Show
   - Link 2: Mobile only → Show (visitor is mobile)
   - Link 3: Business hours only → Hide (outside hours)
7. Analytics Tracking:
   - Record hub visit with device/country
8. Response:
   - Hub info + filtered links
9. Frontend displays links
```

### 2. **Link Click Flow**
```
1. User clicks link on public hub
2. Frontend tracks click: POST /api/analytics/click
3. Analytics Service:
   - Record link click with context
   - Update click count for performance rules
4. Redirect user to actual URL
5. Future visitors may see reordered links (if auto-sort enabled)
```

### 3. **Rule Evaluation Example**
```
Link: "My Instagram"
Rules:
- Time: 09:00-17:00, Monday-Friday
- Device: mobile, desktop (no tablet)
- Geo: allowed US, CA, GB
- Performance: minClicks 5, autoSort true

Visitor Context:
- Time: Tuesday 14:30
- Device: mobile
- Country: US
- Link has 12 clicks

Evaluation:
✅ Time rule: 14:30 is between 09:00-17:00, Tuesday is weekday
✅ Device rule: mobile is in allowed list
✅ Geo rule: US is in allowed list
✅ Performance rule: 12 clicks > 5 minimum
✅ Result: SHOW LINK

Priority Calculation:
- Base priority: 100
- Mobile priority boost: +100 (device matches priority)
- US priority boost: +50 (geo matches priority)
- Performance boost: +24 (12 clicks × 2 for autoSort)
- Final priority: 274
```

## 🔧 Database Performance Optimizations

### Indexing Strategy
```sql
-- Fast user hub lookups
CREATE INDEX idx_hubs_user_id ON hubs(user_id);

-- Fast public hub resolution
CREATE INDEX idx_hubs_slug ON hubs(slug);

-- Fast link queries within hubs
CREATE INDEX idx_links_hub_id ON links(hub_id);

-- Fast rule lookups for links
CREATE INDEX idx_rules_link_id ON rules(link_id);

-- Fast analytics queries
CREATE INDEX idx_analytics_hub_id ON analytics(hub_id);
CREATE INDEX idx_analytics_link_id ON analytics(link_id);
CREATE INDEX idx_analytics_timestamp ON analytics(timestamp);
```

### Query Optimization
- **Prisma Relations**: Efficient JOIN queries
- **Select Specific Fields**: Reduce data transfer
- **Connection Pooling**: Reuse database connections
- **Prepared Statements**: Prevent SQL injection, improve performance

### Caching Strategy
- **Application Level**: React Query caches API responses
- **Database Level**: PostgreSQL query plan caching
- **CDN Level**: Static assets cached globally

## 🛡️ Security Considerations

### Database Security
- **Parameterized Queries**: Prisma prevents SQL injection
- **Connection Encryption**: SSL/TLS for database connections
- **Access Control**: Database user has minimal required permissions
- **Backup Strategy**: Automated backups on Render

### Data Privacy
- **Password Security**: bcrypt hashing, never store plain text
- **Analytics Anonymization**: No personal data in analytics
- **GDPR Compliance**: User data deletion cascades properly
- **IP Address Handling**: Only used for geo detection, not stored long-term

### API Security
- **Rate Limiting**: Prevent abuse of public endpoints
- **CORS Configuration**: Controlled cross-origin access
- **Input Validation**: Zod schemas validate all inputs
- **Error Handling**: No sensitive data in error messages

This database and services architecture provides a robust, scalable foundation for the Smart Link Hub platform with intelligent link management, comprehensive analytics, and flexible conditional rules.