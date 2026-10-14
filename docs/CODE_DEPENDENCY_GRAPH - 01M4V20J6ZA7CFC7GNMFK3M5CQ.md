---
id: 01M4V20J6ZA7CFC7GNMFK3M5CQ
title: Codebase Dependency & Knowledge Graph
category: architecture
status: completed
edges_count: 643
broken_links: 0
---

# 🕸️ Codebase Dependency & Knowledge Graph (ULID-Powered)

Bản đồ cấu trúc quan hệ toàn diện giữa các tệp mã nguồn và tài liệu kỹ thuật trong dự án.

## 1. Sơ Đồ Cụm Quan Hệ Cốt Lõi (Architecture Clusters)

```mermaid
graph TD
    subgraph FrontendVue["Frontend Vue 3 SPA (frontend/src/)"]
        AppVue["App.vue"]
        CrawlerTab["views/CrawlerTab.vue"]
        MaxTinModal["components/crawler/UpdateMaxTinModal.vue"]
        ProvApi["api/provinces.ts"]
        AppVue --> CrawlerTab --> MaxTinModal --> ProvApi
    end

    subgraph FastifyBackend["TypeScript Fastify Gateway (src/modules/)"]
        ProvRoutes["provinces.routes.ts"]
        ProvService["provinces.service.ts"]
        ProvTypes["provinces.types.ts"]
        ProvRoutes --> ProvService --> ProvTypes
    end

    subgraph PythonCrawler["Python AI Solver & Engine (crawler_core/)"]
        EnginePy["crawler_core/engine.py (Adaptive Probe)"]
        ValidatorPy["crawler_core/validator.py"]
        GapFillerPy["crawler_core/gap_filler.py"]
        EnginePy --> ValidatorPy
        EnginePy --> GapFillerPy
    end

    subgraph DocsTopics["Technical Documentation (docs/topics/)"]
        Topic16["Topic 16: Adaptive Probe Scan & ULID Graph"]
        Topic04["Topic 04: HTKK Taxonomy"]
        Topic12["Topic 12: Vue 3 Modernization"]
    end

    ProvApi -.->|REST :8123| ProvRoutes
    EnginePy -.-> Topic16
    ProvService -.-> Topic04
    CrawlerTab -.-> Topic12
```

## 2. Thống Kê Ma Trận Quan Hệ
- **Tổng số quan hệ thực tế:** 643 liên kết hợp lệ.
- **Tỷ lệ liên kết hỏng:** 0 broken links (100% hợp lệ).
- **Cơ chế xác thực:** Tự động kiểm tra liên tục qua `python scripts/audit_code_graph.py`.
