# API Documentation

Complete API client for the STR Admin Dashboard.

## Usage

```typescript
import { authApi, usersApi, membershipApi, newsApi, socialApi, analyticsApi } from '@/lib/api';
```

## Authentication API (`authApi`)

### `login(credentials)`
Login with email and password
```typescript
const { accessToken, refreshToken } = await authApi.login({
  email: 'user@example.com',
  password: 'password123'
});
```

### `refresh(refreshToken)`
Refresh access token
```typescript
const { accessToken, refreshToken } = await authApi.refresh(oldRefreshToken);
```

### `logout(refreshToken)`
Logout and invalidate refresh token
```typescript
await authApi.logout(refreshToken);
```

## Users API (`usersApi`)

### `getAll()`
Get all users
```typescript
const users = await usersApi.getAll();
```

### `getById(id)`
Get user by ID
```typescript
const user = await usersApi.getById('user-id');
```

### `create(userData)`
Create new user
```typescript
const user = await usersApi.create({
  email: 'newuser@example.com',
  password: 'password123',
  roleIds: ['ADMIN']
});
```

### `update(id, userData)`
Update user
```typescript
const user = await usersApi.update('user-id', {
  isActive: false
});
```

### `delete(id)`
Delete user
```typescript
await usersApi.delete('user-id');
```

### `assignRoles(id, roleIds)`
Assign roles to user
```typescript
const user = await usersApi.assignRoles('user-id', ['ADMIN', 'MODERATOR']);
```

## Membership API (`membershipApi`)

### Public

#### `apply(data)`
Apply for membership (public)
```typescript
const membership = await membershipApi.apply({
  fullName: 'John Doe',
  dob: '1990-01-01',
  email: 'john@example.com',
  // ... other fields
});
```

### Admin

#### `getAll()`
Get all memberships
```typescript
const memberships = await membershipApi.getAll();
```

#### `getPending()`
Get pending memberships
```typescript
const pending = await membershipApi.getPending();
```

#### `getApproved()`
Get approved memberships
```typescript
const approved = await membershipApi.getApproved();
```

#### `getRejected()`
Get rejected memberships
```typescript
const rejected = await membershipApi.getRejected();
```

#### `approve(id)`
Approve membership
```typescript
const membership = await membershipApi.approve('membership-id');
```

#### `reject(id, reason)`
Reject membership
```typescript
const membership = await membershipApi.reject('membership-id', 'Incomplete information');
```

## News API (`newsApi`)

### Public

#### `getPublished()`
Get published news
```typescript
const news = await newsApi.getPublished();
```

### Admin

#### `getAll()`
Get all news
```typescript
const allNews = await newsApi.getAll();
```

#### `getById(id)`
Get news by ID
```typescript
const news = await newsApi.getById('news-id');
```

#### `create(newsData)`
Create news
```typescript
const news = await newsApi.create({
  title: 'Breaking News',
  content: '<p>News content...</p>',
  summary: 'Brief summary',
  coverImage: 'https://example.com/image.jpg'
});
```

#### `update(id, newsData)`
Update news
```typescript
const news = await newsApi.update('news-id', {
  title: 'Updated Title',
  isPublished: true
});
```

#### `publish(id)`
Publish news
```typescript
const news = await newsApi.publish('news-id');
```

#### `unpublish(id)`
Unpublish news
```typescript
const news = await newsApi.unpublish('news-id');
```

## Social API (`socialApi`)

### Public

#### `getInstagramPublic()`
Get public Instagram posts
```typescript
const posts = await socialApi.getInstagramPublic();
```

#### `getXPublic()`
Get public X/Twitter posts
```typescript
const posts = await socialApi.getXPublic();
```

### Admin

#### `getInstagramAdmin()`
Get all Instagram posts
```typescript
const posts = await socialApi.getInstagramAdmin();
```

#### `getXAdmin()`
Get all X posts
```typescript
const posts = await socialApi.getXAdmin();
```

#### `createInstagram(postData)`
Create Instagram post
```typescript
const post = await socialApi.createInstagram({
  postUrl: 'https://instagram.com/p/...',
  caption: 'Check this out!',
  isActive: true
});
```

#### `createX(postData)`
Create X post
```typescript
const post = await socialApi.createX({
  postUrl: 'https://x.com/...',
  caption: 'Latest update',
  isActive: true
});
```

#### `updateInstagram(id, postData)`
Update Instagram post
```typescript
const post = await socialApi.updateInstagram('post-id', {
  isActive: false
});
```

#### `updateX(id, postData)`
Update X post
```typescript
const post = await socialApi.updateX('post-id', {
  caption: 'Updated caption'
});
```

#### `toggleInstagramActive(id, isActive)`
Toggle Instagram post active status
```typescript
const post = await socialApi.toggleInstagramActive('post-id', false);
```

#### `toggleXActive(id, isActive)`
Toggle X post active status
```typescript
const post = await socialApi.toggleXActive('post-id', true);
```

## Analytics API (`analyticsApi`)

#### `getDashboard()`
Get dashboard overview
```typescript
const dashboard = await analyticsApi.getDashboard();
```

#### `getMemberships()`
Get membership analytics
```typescript
const analytics = await analyticsApi.getMemberships();
```

#### `getMembershipDimensions()`
Get membership dimension-wise analytics
```typescript
const dimensions = await analyticsApi.getMembershipDimensions();
```

#### `getUsers()`
Get user analytics
```typescript
const userStats = await analyticsApi.getUsers();
```

#### `getNews()`
Get news analytics
```typescript
const newsStats = await analyticsApi.getNews();
```

#### `getSocial()`
Get social media analytics
```typescript
const socialStats = await analyticsApi.getSocial();
```

## Error Handling

All API methods handle errors gracefully:
- Authentication errors return empty arrays or null
- Network errors are logged to console
- Failed requests don't crash the application

## Base URL

Default: `http://localhost:5001/api/v1`

Configure via environment variable:
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api/v1
```
