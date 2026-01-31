# ImageKit Integration Architecture Diagrams

This document contains comprehensive Mermaid diagrams illustrating the ImageKit integration architecture, data flow, and component relationships in Next.js applications.

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Image Upload Flow](#image-upload-flow)
3. [Component Relationship Diagram](#component-relationship-diagram)
4. [Service Layer Architecture](#service-layer-architecture)
5. [Image Transformation Flow](#image-transformation-flow)

---

## System Architecture Overview

This diagram shows the high-level architecture of the ImageKit integration:

```mermaid
graph TB
    subgraph "Client Layer"
        UI[React Components<br/>ImageUpload Component]
        Hook[useImageUpload Hook]
        Page[Next.js Pages<br/>Admin/Blog/Product Pages]
    end

    subgraph "Next.js Application"
        subgraph "API Routes"
            UploadAPI[POST /api/images/upload]
            DeleteAPI[DELETE /api/images/delete]
            TestAPI[GET /api/images/test]
        end
        
        subgraph "Authentication"
            NextAuth[NextAuth.js Session]
            AuthCheck{Check Session}
        end
        
        subgraph "Service Layer"
            ImageKitService[ImageKitService<br/>Singleton Pattern]
            Utils[Utility Functions<br/>isImageKitUrl<br/>optimizeImageKitUrl]
        end
        
        subgraph "Configuration"
            EnvVars[Environment Variables<br/>PUBLIC_KEY<br/>PRIVATE_KEY<br/>URL_ENDPOINT]
            NextConfig[next.config.js<br/>Image Optimization<br/>CSP Headers]
        end
    end

    subgraph "External Services"
        ImageKit[ImageKit Cloud<br/>CDN & Storage]
        CDN[Global CDN<br/>Image Delivery]
    end

    subgraph "Database"
        DB[(Supabase Database<br/>Store fileId & URL)]
    end

    UI -->|User selects file| Hook
    Hook -->|FormData| UploadAPI
    Page -->|Uses| UI
    Page -->|Uses| Hook
    
    UploadAPI -->|Validates| AuthCheck
    AuthCheck -->|Session| NextAuth
    AuthCheck -->|Authorized| ImageKitService
    UploadAPI -->|Validates File| ImageKitService
    
    ImageKitService -->|Reads| EnvVars
    ImageKitService -->|Uploads| ImageKit
    ImageKitService -->|Returns| UploadAPI
    
    UploadAPI -->|Saves| DB
    UploadAPI -->|Returns URL| Hook
    Hook -->|Updates State| UI
    
    ImageKit -->|Stores| CDN
    CDN -->|Serves Images| UI
    
    DeleteAPI -->|Validates| AuthCheck
    DeleteAPI -->|Deletes| ImageKitService
    ImageKitService -->|Deletes| ImageKit
    
    Utils -->|Optimizes| ImageKit
    NextConfig -->|Configures| CDN

    style UI fill:#e1f5ff
    style Hook fill:#e1f5ff
    style UploadAPI fill:#fff4e1
    style ImageKitService fill:#e8f5e9
    style ImageKit fill:#fce4ec
    style CDN fill:#fce4ec
    style DB fill:#f3e5f5
```

---

## Image Upload Flow

This diagram illustrates the complete image upload process from user interaction to ImageKit storage:

```mermaid
sequenceDiagram
    participant User
    participant Component as ImageUpload Component
    participant Hook as useImageUpload Hook
    participant API as /api/images/upload
    participant Auth as NextAuth Session
    participant Service as ImageKitService
    participant ImageKit as ImageKit Cloud
    participant DB as Database

    User->>Component: Select/Drag Image File
    Component->>Component: Validate File Type & Size
    Component->>Component: Create Preview URL
    
    alt Validation Fails
        Component->>User: Show Error Message
    else Validation Passes
        Component->>Hook: uploadImage(file)
        Hook->>Hook: Validate File
        Hook->>Hook: Set Uploading State
        Hook->>Hook: Simulate Progress
        
        Hook->>API: POST /api/images/upload<br/>(FormData: file, folder, tags)
        
        API->>Auth: Check Session
        Auth-->>API: Session Data
        
        alt Not Authenticated
            API-->>Hook: 401 Unauthorized
            Hook->>User: Show Error
        else Not Admin
            API-->>Hook: 403 Forbidden
            Hook->>User: Show Error
        else Authenticated & Authorized
            API->>API: Parse FormData
            API->>API: Validate File Type
            API->>API: Validate File Size
            API->>API: Convert File to Buffer
            API->>API: Generate Unique Filename
            
            API->>Service: uploadImage(buffer, filename, folder, tags)
            Service->>Service: Initialize ImageKit Client
            Service->>Service: Check Environment Variables
            
            Service->>ImageKit: Upload Image<br/>(Buffer, Metadata)
            
            alt Upload Fails
                ImageKit-->>Service: Error Response
                Service-->>API: Throw Error
                API-->>Hook: 500 Error
                Hook->>User: Show Error Message
            else Upload Success
                ImageKit-->>Service: Upload Result<br/>(fileId, url, dimensions)
                Service-->>API: ImageKitUploadResult
                
                API->>DB: Store fileId & URL (Optional)
                API-->>Hook: Success Response<br/>{url, fileId, width, height}
                
                Hook->>Hook: Update imageUrl State
                Hook->>Hook: Set Upload Progress 100%
                Hook->>Component: onSuccess Callback
                Component->>Component: Update Preview
                Component->>User: Show Success Toast
            end
        end
    end
```

---

## Component Relationship Diagram

This diagram shows how React components, hooks, and services interact:

```mermaid
graph LR
    subgraph "React Components"
        ImageUpload[ImageUpload Component<br/>- Drag & Drop<br/>- Preview<br/>- Progress<br/>- URL Input]
        BlogForm[Blog Post Form]
        ProductForm[Product Form]
        AdminPage[Admin Pages]
    end

    subgraph "Custom Hooks"
        useImageUpload[useImageUpload Hook<br/>- State Management<br/>- Validation<br/>- Upload Logic<br/>- Error Handling]
    end

    subgraph "API Layer"
        UploadRoute[POST /api/images/upload<br/>- Authentication<br/>- Authorization<br/>- Validation<br/>- File Processing]
        DeleteRoute[DELETE /api/images/delete<br/>- Authentication<br/>- File Deletion]
    end

    subgraph "Service Layer"
        ImageKitService[ImageKitService Class<br/>- initialize<br/>- uploadImage<br/>- uploadFromUrl<br/>- deleteImage<br/>- getImageUrl<br/>- getThumbnailUrl]
    end

    subgraph "Utilities"
        URLUtils[URL Utilities<br/>- isImageKitUrl<br/>- optimizeImageKitUrl]
    end

    subgraph "External"
        ImageKitAPI[ImageKit SDK<br/>- Upload<br/>- Delete<br/>- Transformations]
    end

    ImageUpload -->|Uses| useImageUpload
    BlogForm -->|Uses| ImageUpload
    ProductForm -->|Uses| ImageUpload
    AdminPage -->|Uses| ImageUpload
    
    useImageUpload -->|Calls| UploadRoute
    useImageUpload -->|Manages State| ImageUpload
    
    UploadRoute -->|Uses| ImageKitService
    DeleteRoute -->|Uses| ImageKitService
    
    ImageKitService -->|Uses| ImageKitAPI
    ImageKitService -->|Uses| URLUtils
    
    URLUtils -->|Optimizes| ImageKitAPI

    style ImageUpload fill:#e1f5ff
    style useImageUpload fill:#e8f5e9
    style UploadRoute fill:#fff4e1
    style ImageKitService fill:#f3e5f5
    style ImageKitAPI fill:#fce4ec
```

---

## Service Layer Architecture

This diagram details the ImageKitService class structure and methods:

```mermaid
classDiagram
    class ImageKitService {
        -static imagekit: ImageKit
        +static initialize() ImageKit
        +static uploadImage(buffer, filename, folder, tags) Promise~ImageKitUploadResult~
        +static uploadFromUrl(url, filename, folder, tags) Promise~ImageKitUploadResult~
        +static deleteImage(fileId) Promise~boolean~
        +static getImageDetails(fileId) Promise~ImageKitUploadResult~
        +static getImageUrl(fileId, transformations) string
        +static getThumbnailUrl(fileId, width, height) string
    }

    class ImageKitUploadResult {
        +string fileId
        +string name
        +string url
        +string? thumbnailUrl
        +string fileType
        +number? fileSize
        +number? height
        +number? width
    }

    class ImageKit {
        +upload(options, callback)
        +deleteFile(fileId, callback)
        +getFileDetails(fileId, callback)
        +url(options) string
        +getAuthenticationParameters() object
    }

    class Transformations {
        +number? width
        +number? height
        +number? quality
        +string? format
        +string? crop
        +string? focus
    }

    ImageKitService --> ImageKit : uses
    ImageKitService --> ImageKitUploadResult : returns
    ImageKitService --> Transformations : accepts
    ImageKitService ..> Environment : reads
        Environment : IMAGEKIT_PUBLIC_KEY
        Environment : IMAGEKIT_PRIVATE_KEY
        Environment : IMAGEKIT_URL_ENDPOINT

    note for ImageKitService "Singleton Pattern\nInitializes once and reuses"
    note for ImageKitService "All methods are static\nNo instance needed"
```

---

## Image Transformation Flow

This diagram shows how image transformations work with ImageKit:

```mermaid
flowchart TD
    Start([User Requests Image]) --> Check{Image Source?}
    
    Check -->|File ID| UseFileId[Use fileId for Transformation]
    Check -->|URL| ExtractFileId[Extract fileId from URL]
    
    UseFileId --> GetTransformations[Get Transformation Parameters<br/>width, height, quality, format]
    ExtractFileId --> GetTransformations
    
    GetTransformations --> BuildURL[ImageKitService.getImageUrl<br/>fileId + transformations]
    
    BuildURL --> GenerateURL[ImageKit SDK generates URL<br/>with transformation parameters]
    
    GenerateURL --> CDNRequest[Request from ImageKit CDN<br/>with transformation query]
    
    CDNRequest --> Transform{Transformation Type?}
    
    Transform -->|Resize| Resize[Resize Image<br/>Maintain Aspect Ratio]
    Transform -->|Crop| Crop[Crop Image<br/>Smart Focus]
    Transform -->|Format| Format[Convert Format<br/>WebP, AVIF, Auto]
    Transform -->|Quality| Quality[Optimize Quality<br/>80-90 for web]
    Transform -->|Combined| Combined[Apply All Transformations]
    
    Resize --> Cache[Cache Transformed Image]
    Crop --> Cache
    Format --> Cache
    Quality --> Cache
    Combined --> Cache
    
    Cache --> Serve[Serve Optimized Image<br/>via Global CDN]
    
    Serve --> Client[Client Receives Image<br/>Optimized for Device]
    
    Client --> NextImage[Next.js Image Component<br/>Lazy Loading<br/>Responsive Sizing]
    
    style Start fill:#e1f5ff
    style BuildURL fill:#e8f5e9
    style CDNRequest fill:#fff4e1
    style Cache fill:#f3e5f5
    style Serve fill:#fce4ec
    style Client fill:#e1f5ff
```

---

## Complete Integration Flow

This comprehensive diagram shows the end-to-end flow from setup to image delivery:

```mermaid
graph TB
    subgraph "Setup Phase"
        Setup[Project Setup] --> Install[Install imagekit package]
        Install --> Config[Configure Environment Variables]
        Config --> Test[Test Connection Script]
        Test --> Verify{Verification}
        Verify -->|Success| Ready[Ready for Integration]
        Verify -->|Failure| Config
    end

    subgraph "Development Phase"
        Ready --> CreateService[Create ImageKitService]
        CreateService --> CreateAPI[Create API Routes]
        CreateAPI --> CreateComponent[Create React Components]
        CreateComponent --> CreateHook[Create Custom Hooks]
    end

    subgraph "Runtime Phase"
        CreateHook --> UserAction[User Action]
        UserAction --> SelectFile[Select Image File]
        SelectFile --> Validate[Client Validation]
        Validate -->|Invalid| ShowError[Show Error]
        Validate -->|Valid| Upload[Upload to API]
        Upload --> AuthCheck[Authentication Check]
        AuthCheck -->|Unauthorized| ShowError
        AuthCheck -->|Authorized| Process[Process File]
        Process --> UploadToImageKit[Upload to ImageKit]
        UploadToImageKit -->|Success| StoreDB[Store in Database]
        UploadToImageKit -->|Error| ShowError
        StoreDB --> ReturnURL[Return Image URL]
        ReturnURL --> Display[Display Image]
        Display --> Transform[Apply Transformations]
        Transform --> Deliver[Deliver via CDN]
    end

    subgraph "Optimization Phase"
        Deliver --> Monitor[Monitor Usage]
        Monitor --> Optimize[Optimize Settings]
        Optimize --> Cache[Cache Strategy]
        Cache --> Performance[Performance Metrics]
    end

    style Setup fill:#e1f5ff
    style Ready fill:#e8f5e9
    style UploadToImageKit fill:#fff4e1
    style Deliver fill:#fce4ec
    style Performance fill:#f3e5f5
```

---

## Data Flow Diagram

This diagram shows the data flow through the entire system:

```mermaid
flowchart LR
    subgraph "Input"
        File[Image File<br/>JPEG, PNG, WebP, GIF]
        Metadata[Metadata<br/>folder, tags, filename]
    end

    subgraph "Client Processing"
        File --> Validate[Validate<br/>Type & Size]
        Validate --> FormData[Create FormData]
        Metadata --> FormData
        FormData --> API[Send to API]
    end

    subgraph "Server Processing"
        API --> Auth[Authenticate User]
        Auth --> Parse[Parse FormData]
        Parse --> ServerValidate[Server Validation]
        ServerValidate --> Convert[Convert to Buffer]
        Convert --> GenerateName[Generate Unique Name]
        GenerateName --> Service[ImageKitService]
    end

    subgraph "ImageKit Service"
        Service --> Init[Initialize Client]
        Init --> Upload[Upload Image]
        Upload --> ImageKitAPI[ImageKit API]
    end

    subgraph "ImageKit Cloud"
        ImageKitAPI --> Store[Store Image]
        Store --> Process[Process & Optimize]
        Process --> CDN[CDN Distribution]
    end

    subgraph "Response"
        CDN --> Response[Return Response<br/>fileId, url, dimensions]
        Response --> DB[(Database<br/>Store Reference)]
        Response --> Client[Return to Client]
    end

    subgraph "Client Display"
        Client --> State[Update State]
        State --> Preview[Show Preview]
        Preview --> Transform[Apply Transformations]
        Transform --> Display[Display Image]
    end

    style File fill:#e1f5ff
    style Service fill:#e8f5e9
    style ImageKitAPI fill:#fff4e1
    style CDN fill:#fce4ec
    style Display fill:#f3e5f5
```

---

## Security & Authentication Flow

This diagram illustrates the security layers in the ImageKit integration:

```mermaid
graph TD
    Request[API Request] --> ExtractToken[Extract Session Token]
    ExtractToken --> ValidateToken[Validate Token with NextAuth]
    
    ValidateToken -->|Invalid| Reject1[401 Unauthorized]
    ValidateToken -->|Valid| GetSession[Get User Session]
    
    GetSession --> CheckRole{Check User Role}
    
    CheckRole -->|Not Admin| Reject2[403 Forbidden]
    CheckRole -->|Admin| ValidateFile[Validate File]
    
    ValidateFile --> CheckType{File Type Valid?}
    CheckType -->|Invalid| Reject3[400 Bad Request]
    CheckType -->|Valid| CheckSize{File Size OK?}
    
    CheckSize -->|Too Large| Reject4[400 File Too Large]
    CheckSize -->|OK| Sanitize[Sanitize Filename]
    
    Sanitize --> CheckEnv[Check Environment Variables]
    CheckEnv -->|Missing| Reject5[500 Configuration Error]
    CheckEnv -->|Present| Encrypt[Encrypt with Private Key]
    
    Encrypt --> Upload[Upload to ImageKit]
    Upload -->|Success| Store[Store Reference Securely]
    Upload -->|Failure| Reject6[500 Upload Error]
    
    Store --> Log[Log Activity]
    Log --> Return[Return Secure URL]

    style Request fill:#e1f5ff
    style ValidateToken fill:#fff4e1
    style CheckRole fill:#e8f5e9
    style Encrypt fill:#f3e5f5
    style Upload fill:#fce4ec
    style Return fill:#e8f5e9
```

---

## Usage Examples Flow

This diagram shows different usage patterns:

```mermaid
graph TB
    subgraph "Pattern 1: Component Usage"
        Component[ImageUpload Component] --> Props[Props:<br/>folder, tags, maxSizeMB]
        Props --> Upload1[Automatic Upload]
        Upload1 --> Result1[Get URL & fileId]
    end

    subgraph "Pattern 2: Hook Usage"
        Hook[useImageUpload Hook] --> Config[Configuration:<br/>folder, tags, callbacks]
        Config --> Upload2[Manual Upload]
        Upload2 --> State[State Management]
        State --> Result2[Get URL & fileId]
    end

    subgraph "Pattern 3: Server-Side Usage"
        Server[Server Component/API] --> Service[ImageKitService]
        Service --> Upload3[Direct Upload]
        Upload3 --> Result3[Get URL & fileId]
    end

    subgraph "Pattern 4: URL Upload"
        External[External URL] --> Service2[ImageKitService.uploadFromUrl]
        Service2 --> Fetch[Fetch Image]
        Fetch --> Upload4[Upload to ImageKit]
        Upload4 --> Result4[Get URL & fileId]
    end

    subgraph "Pattern 5: Transformations"
        FileId[File ID] --> Transform[ImageKitService.getImageUrl]
        Transform --> Params[Transformation Params]
        Params --> Optimized[Optimized URL]
    end

    Result1 --> Transform
    Result2 --> Transform
    Result3 --> Transform
    Result4 --> Transform

    style Component fill:#e1f5ff
    style Hook fill:#e8f5e9
    style Service fill:#fff4e1
    style Transform fill:#f3e5f5
    style Optimized fill:#fce4ec
```

---

## Summary

These diagrams provide a comprehensive visual representation of:

1. **System Architecture**: High-level overview of all components
2. **Upload Flow**: Step-by-step upload process
3. **Component Relationships**: How React components interact
4. **Service Layer**: Detailed service class structure
5. **Transformation Flow**: How image transformations work
6. **Integration Flow**: End-to-end integration process
7. **Data Flow**: How data moves through the system
8. **Security Flow**: Authentication and authorization layers
9. **Usage Patterns**: Different ways to use the integration

Use these diagrams to:
- Understand the architecture
- Onboard new developers
- Debug issues
- Plan new features
- Document the system
