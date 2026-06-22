# COP Manager — Contexto do Projeto

## Stack
- Frontend: React 19 + TypeScript + Vite + TailwindCSS + shadcn/ui + tRPC client
- Backend: Node.js + Express + tRPC + Drizzle ORM
- Banco: MySQL 8 local, banco cop_manager, senha root: Different@34
- Auth: JWT + bcrypt
- Gerenciador: pnpm

## Como rodar
cd "C:\Users\meeti\OneDrive\Documentos\00-RL Consultoria\3-CLIENTES\1-PROJETOS\13-APP-CERT_COP"
pnpm dev
Acesse: http://localhost:3000
Login: luciano / [senha mantida em segredo — não registrar aqui]

## Estado atual (Junho 2026)
Todas as 6 fases implementadas:
- Fase 1: Banco único MySQL (sem localStorage)
- Fase 2: CPR-01 cadastrado completo
- Fase 3: cop_requirements sincronizados com Cap. 7
- Fase 4: Vinculo evidencias → itens COP automático
- Fase 5: Dashboard com conformidade real
- Fase 6: Relatório Executivo e Detalhado

## Progresso dos CPRs
- CPR-01: completo ✅
- CPR-02: completo ✅ (29 linhas Cap.6, 16 itens COP vinculados)
- CPR-03 a CPR-16: pendentes

## Banco de dados (6 tabelas principais)
- users: autenticação local
- procedures: CPRs com coluna sections (JSON)
- cop_requirements: 17 itens COP do CPR-01
- evidence_verifications: evidências preenchidas
- operational_steps: etapas operacionais
- procedure_cop_links: vínculos N:N

## Próximos passos
- Cadastrar CPR-02, CPR-03 e demais CPRs
- Preencher evidências do CPR-01 completamente

## Repositório
https://github.com/Luciano434/cop-manager
