# App Certificação COP - TODO

## Fase 1: Estrutura de Dados
- [x] Definir schema de procedimentos (código, nome, descrição, status, responsável)
- [x] Definir schema de etapas operacionais (nome, descrição, responsável, entrada, saída, evidência obrigatória, status)
- [x] Definir schema de requisitos COP (código, descrição, status de conformidade)
- [x] Definir schema de vínculo procedimento-requisito (relação bidirecional)
- [x] Definir schema de evidências (arquivo, procedimento, etapa, requisito, data, responsável)
- [x] Gerar e aplicar migrations do banco de dados

## Fase 2: Layout Base e Roteamento
- [x] Criar layout com sidebar de navegação
- [x] Implementar roteamento entre módulos (Procedimentos, Dashboard COP, Requisitos, Evidências)
- [x] Aplicar design elegante e sofisticado (tipografia, espaçamento, cores)
- [x] Criar componentes base (header, sidebar, card, table)

## Fase 3: Módulo de Procedimentos
- [x] Criar página de listagem de procedimentos
- [x] Implementar busca e filtros por código, nome e status
- [x] Criar página de detalhes do procedimento
- [ ] Implementar CRUD de procedimentos (criar, editar, deletar)
- [x] Exibir status do procedimento com indicadores visuais

## Fase 4: Módulo de Etapas Operacionais
- [x] Criar listagem de etapas dentro de um procedimento
- [ ] Implementar CRUD de etapas (criar, editar, deletar)
- [x] Exibir informações completas: descrição, responsável, entrada, saída, evidência, status
- [ ] Vincular evidências obrigatórias às etapas

## Fase 5: Vínculo Procedimento-Requisito COP
- [ ] Criar interface para vincular requisitos a procedimentos
- [ ] Implementar visualização bidirecional (procedimento → requisitos e requisito → procedimentos)
- [ ] Criar tRPC procedures para gerenciar vínculos
- [ ] Exibir requisitos vinculados na página de detalhes do procedimento

## Fase 6: Dashboard COP
- [ ] Criar página de dashboard com visão geral de requisitos
- [ ] Exibir status de conformidade por requisito (atendido, parcial, não atendido)
- [ ] Mostrar procedimentos vinculados a cada requisito
- [ ] Implementar gráficos ou indicadores visuais de conformidade

## Fase 7: Módulo de Evidências
- [ ] Criar repositório de evidências com listagem
- [ ] Implementar upload de arquivos (integração com S3)
- [ ] Vincular evidências a procedimentos, etapas e requisitos
- [ ] Exibir histórico de evidências (data, responsável, versão)

## Fase 8: Dados Iniciais
- [x] Criar procedimento PR-01 com status "em desenvolvimento"
- [x] Criar 6 etapas operacionais do PR-01
- [x] Vincular PR-01 aos requisitos COP (1.A.1, 1.A.2, 1.A.3, 1.B.1)
- [x] Popular requisitos COP no banco de dados
- [x] Executar seed de dados iniciais

## Fase 9: Filtros e Refinamentos
- [ ] Implementar filtro por status de procedimento
- [ ] Implementar filtro por código de procedimento
- [ ] Implementar filtro por requisito COP vinculado
- [ ] Implementar busca por texto livre
- [ ] Refinar UI/UX com melhorias visuais

## Fase 10: Testes e Entrega
- [x] Escrever testes unitários (vitest) para procedures (13 testes passando)
- [x] Testar CRUD de procedimentos
- [x] Testar vínculos procedimento-requisito
- [x] Testar etapas operacionais
- [ ] Revisar design e acessibilidade
- [ ] Criar checkpoint final
- [ ] Entregar sistema ao usuário


## Fase 11: Refinamento PR-01 para Auditoria ANAC
- [x] Atualizar etapa 1: Recebimento do dado de projeto com evidência específica e rastreável
- [x] Atualizar etapa 2: Registro no controle de dados com registro formal
- [x] Atualizar etapa 3: Análise e classificação com critério de aceitação
- [x] Atualizar etapa 4: Aprovação do dado com registro de aprovação
- [x] Atualizar etapa 5: Liberação para uso com rastreabilidade
- [x] Atualizar etapa 6: Controle de revisão com histórico formal
- [x] Garantir rastreabilidade entre etapas (entrada → saída)
- [x] Atualizar dados no banco de dados (script executado com sucesso)
- [x] Atualizar visualização das etapas refinadas na UI
- [x] Validar conformidade com COP e RBAC 21


## Fase 12: Refinamento de Nomenclatura SGQ e Auditabilidade ANAC
- [x] Substituir CR-001 por "Registro de Recebimento de Dados de Projeto"
- [x] Substituir LCD por "Lista Mestra de Dados de Projeto"
- [x] Substituir NC por "Código de Controle do Documento (CC)"
- [x] Ajustar locais de armazenamento para formato auditável (sem caminhos técnicos)
- [x] Incluir verificação de aplicabilidade ao Type Design em etapas relevantes
- [x] Atualizar dados no banco de dados (script executado com sucesso)
- [x] Validar visualização das mudanças
- [ ] Criar checkpoint com refinamentos de nomenclatura


## Fase 13: Criação do PR-02 – Controle de Modificações de Projeto
- [x] Definir 7 etapas operacionais do PR-02 com mesmo padrão do PR-01
- [x] Incluir rastreabilidade completa entre etapas
- [x] Definir evidências específicas e auditáveis para cada etapa
- [x] Incluir validação de impacto no Type Design
- [x] Criar script para popular PR-02 no banco de dados
- [x] Vincular PR-02 aos requisitos COP 1.D.1 a 1.D.8
- [x] Executar seed e validar dados
- [x] Atualizar UI para exibir PR-02 na listagem
- [x] Testar visualização completa do PR-02 (14 testes passando)
- [ ] Criar checkpoint com PR-01 e PR-02


## Fase 14: Criação do PR-03 – Instruções de Aeronavegabilidade Continuada (ICA)
- [x] Definir 7 etapas operacionais do PR-03 com mesmo padrão do PR-01
- [x] Incluir validação de aeronavegabilidade em todas as etapas
- [x] Incluir validação de impacto no Type Design
- [x] Garantir rastreabilidade completa entre etapas
- [x] Criar script para popular PR-03 no banco de dados
- [x] Vincular PR-03 aos requisitos COP 1.C.1 e 1.C.2
- [x] Executar seed e validar dados
- [x] Atualizar UI para exibir PR-03 na listagem
- [x] Testar visualização completa do PR-03 (14 testes passando)
- [ ] Criar checkpoint com PR-01, PR-02 e PR-03


## Fase 15: Correção de Erro Crítico - Independência de Dados entre Procedimentos
- [x] Diagnosticar problema: PR-02 e PR-03 compartilham dados com PR-01
- [x] Validar registros no banco de dados (PR-01, PR-02, PR-03)
- [x] Verificar IDs únicos de cada procedimento
- [x] Corrigir roteamento de navegação por código de procedimento
- [x] Garantir que cada procedimento carregue suas próprias etapas
- [x] Garantir que cada procedimento carregue seus próprios requisitos COP
- [x] Testar independência: editar PR-02 não afeta PR-01
- [x] Testar independência: editar PR-03 não afeta PR-01
- [x] Validar navegação: cada card abre seu próprio procedimento (23 testes passando)
- [x] Criar checkpoint com correção validada (versão: 6a36101c)


## Fase 16: Reestruturação Completa PR-03 – Aeronavegabilidade Continuada
- [x] Redesenhar 8 etapas baseadas em fluxo de evento (não dado de projeto)
- [x] Etapa 1: Identificação de evento ou necessidade (falha, dificuldade, requisito, melhoria)
- [x] Etapa 2: Registro do evento (Registro de Evento em Serviço)
- [x] Etapa 3: Análise técnica (impacto aeronavegabilidade, Type Design, criticidade)
- [x] Etapa 4: Definição da ação (boletim, revisão ICA, instrução técnica)
- [x] Etapa 5: Elaboração da ICA (documento técnico estruturado)
- [x] Etapa 6: Revisão e aprovação técnica
- [x] Etapa 7: Comunicação e distribuição (operadores, manutenção, clientes)
- [x] Etapa 8: Controle de revisão e rastreabilidade
- [x] Incluir avaliação de impacto aeronavegabilidade em todas as etapas
- [x] Criar script para atualizar PR-03 no banco de dados (executado com sucesso)
- [x] Executar seed e validar dados (23 testes passando)
- [x] Atualizar UI com novo PR-03 (8 etapas event-driven)
- [x] Criar checkpoint com reestruturação completa (versão: 9e2e7aba)


## Fase 17: Refinamento PR-03 - Etapas Finais de Aeronavegabilidade Continuada
- [x] Adicionar etapa 9: Definição formal da ação (BS, revisão ICA, instrução técnica)
- [x] Adicionar etapa 10: Elaboração e emissão da ICA com identificação única
- [x] Adicionar etapa 11: Comunicação e distribuição com registro de distribuição
- [x] Adicionar etapa 12: Verificação de efetividade e feedback de campo
- [x] Garantir rastreabilidade completa evento → aplicação da ICA
- [x] Garantir evidência específica em todas as 12 etapas
- [x] Manter consistência com etapas iniciais já corretas
- [x] Atualizar UI com 12 etapas completas
- [x] Testar navegação e rastreabilidade (23 testes passando)
- [x] Criar checkpoint com etapas finais (versão: fab58755)


## Fase 18: Correção de Ordem e Numeração do PR-03
- [x] Diagnosticar ordem incorreta das etapas no PR-03
- [x] Reorganizar etapas em ordem lógica: evento → registro → análise → definição → elaboração → aprovação → comunicação → efetividade
- [x] Atualizar numeração das etapas (1-12) mantendo conteúdo técnico
- [x] Validar sequência no ProcedureDetail.tsx
- [x] Testar navegação e visualização das etapas ordenadas (23 testes passando)
- [x] Criar checkpoint com ordem corrigida (versão: b3203b51)
