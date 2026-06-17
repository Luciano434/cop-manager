import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DefinitionListSection,
  ProcedureDocument,
  ProcedureSection,
  ResponsibilityListSection,
  TextListSection,
  TextSection,
  createEmptyProcedureDocument,
} from "@/lib/procedureModel";

function getSectionSummary(section: ProcedureSection): string {
  switch (section.type) {
    case "text":
      return section.content ? "Preenchido" : "Vazio";

    case "text_list":
    case "definition_list":
    case "responsibility_list":
    case "criteria_list":
    case "indicator_list":
    case "integration_list":
    case "process":
      return `${section.items.length} item(ns)`;

    case "table":
      return `${section.rows.length} linha(s)`;

    default:
      return "";
  }
}

export default function ImportarProcedimento() {
  const [documento, setDocumento] = useState<ProcedureDocument>(() =>
    createEmptyProcedureDocument({
      code: "PR-00",
      name: "Novo Procedimento",
    })
  );

  const [selectedSectionId, setSelectedSectionId] = useState("1");

  const selectedSection = useMemo(() => {
    return documento.sections.find((section) => section.id === selectedSectionId);
  }, [documento.sections, selectedSectionId]);

  function handleNovoProcedimento() {
    setDocumento(
      createEmptyProcedureDocument({
        code: "PR-00",
        name: "Novo Procedimento",
      })
    );
    setSelectedSectionId("1");
  }

  function updateSection(
    sectionId: string,
    updater: (section: ProcedureSection) => ProcedureSection
  ) {
    setDocumento((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId ? updater(section) : section
      ),
    }));
  }

  function updateTextSection(sectionId: string, value: string) {
    updateSection(sectionId, (section) => {
      if (section.type !== "text") return section;
      return {
        ...section,
        content: value,
      };
    });
  }

  function addTextListItem(sectionId: string) {
    updateSection(sectionId, (section) => {
      if (section.type !== "text_list") return section;

      return {
        ...section,
        items: [
          ...section.items,
          {
            id: `${section.id}.${section.items.length + 1}`,
            text: "",
          },
        ],
      };
    });
  }

  function updateTextListItem(
    sectionId: string,
    itemId: string,
    value: string
  ) {
    updateSection(sectionId, (section) => {
      if (section.type !== "text_list") return section;

      return {
        ...section,
        items: section.items.map((item) =>
          item.id === itemId ? { ...item, text: value } : item
        ),
      };
    });
  }

  function removeTextListItem(sectionId: string, itemId: string) {
    updateSection(sectionId, (section) => {
      if (section.type !== "text_list") return section;

      const filtered = section.items.filter((item) => item.id !== itemId);

      return {
        ...section,
        items: filtered.map((item, index) => ({
          ...item,
          id: `${section.id}.${index + 1}`,
        })),
      };
    });
  }

  function addDefinitionItem(sectionId: string) {
    updateSection(sectionId, (section) => {
      if (section.type !== "definition_list") return section;

      return {
        ...section,
        items: [
          ...section.items,
          {
            id: `${section.id}.${section.items.length + 1}`,
            term: "",
            definition: "",
          },
        ],
      };
    });
  }

  function updateDefinitionItem(
    sectionId: string,
    itemId: string,
    field: "term" | "definition",
    value: string
  ) {
    updateSection(sectionId, (section) => {
      if (section.type !== "definition_list") return section;

      return {
        ...section,
        items: section.items.map((item) =>
          item.id === itemId ? { ...item, [field]: value } : item
        ),
      };
    });
  }

  function removeDefinitionItem(sectionId: string, itemId: string) {
    updateSection(sectionId, (section) => {
      if (section.type !== "definition_list") return section;

      const filtered = section.items.filter((item) => item.id !== itemId);

      return {
        ...section,
        items: filtered.map((item, index) => ({
          ...item,
          id: `${section.id}.${index + 1}`,
        })),
      };
    });
  }

  function addResponsibilityItem(sectionId: string) {
    updateSection(sectionId, (section) => {
      if (section.type !== "responsibility_list") return section;

      return {
        ...section,
        items: [
          ...section.items,
          {
            id: `${section.id}.${section.items.length + 1}`,
            role: "",
            duties: [],
          },
        ],
      };
    });
  }

  function updateResponsibilityRole(
    sectionId: string,
    itemId: string,
    value: string
  ) {
    updateSection(sectionId, (section) => {
      if (section.type !== "responsibility_list") return section;

      return {
        ...section,
        items: section.items.map((item) =>
          item.id === itemId ? { ...item, role: value } : item
        ),
      };
    });
  }

  function addDutyToResponsibility(sectionId: string, itemId: string) {
    updateSection(sectionId, (section) => {
      if (section.type !== "responsibility_list") return section;

      return {
        ...section,
        items: section.items.map((item) =>
          item.id === itemId
            ? { ...item, duties: [...item.duties, ""] }
            : item
        ),
      };
    });
  }

  function updateDutyInResponsibility(
    sectionId: string,
    itemId: string,
    dutyIndex: number,
    value: string
  ) {
    updateSection(sectionId, (section) => {
      if (section.type !== "responsibility_list") return section;

      return {
        ...section,
        items: section.items.map((item) => {
          if (item.id !== itemId) return item;

          return {
            ...item,
            duties: item.duties.map((duty, index) =>
              index === dutyIndex ? value : duty
            ),
          };
        }),
      };
    });
  }

  function removeDutyFromResponsibility(
    sectionId: string,
    itemId: string,
    dutyIndex: number
  ) {
    updateSection(sectionId, (section) => {
      if (section.type !== "responsibility_list") return section;

      return {
        ...section,
        items: section.items.map((item) => {
          if (item.id !== itemId) return item;

          return {
            ...item,
            duties: item.duties.filter((_, index) => index !== dutyIndex),
          };
        }),
      };
    });
  }

  function removeResponsibilityItem(sectionId: string, itemId: string) {
    updateSection(sectionId, (section) => {
      if (section.type !== "responsibility_list") return section;

      const filtered = section.items.filter((item) => item.id !== itemId);

      return {
        ...section,
        items: filtered.map((item, index) => ({
          ...item,
          id: `${section.id}.${index + 1}`,
        })),
      };
    });
  }

  function renderTextSection(section: TextSection) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium">Texto do item</p>
        <textarea
          className="w-full min-h-[260px] rounded-md border p-3 text-sm"
          value={section.content}
          onChange={(e) => updateTextSection(section.id, e.target.value)}
          placeholder="Cole aqui o texto do item exatamente como aprovado no DOCX."
        />
      </div>
    );
  }

  function renderTextListSection(section: TextListSection) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">Itens da lista</p>
          <Button type="button" variant="outline" onClick={() => addTextListItem(section.id)}>
            Adicionar item
          </Button>
        </div>

        {section.items.length === 0 ? (
          <div className="rounded-md border p-4 text-sm text-muted-foreground">
            Nenhum item adicionado ainda.
          </div>
        ) : (
          <div className="space-y-3">
            {section.items.map((item) => (
              <div key={item.id} className="rounded-md border p-3 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{item.id}</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeTextListItem(section.id, item.id)}
                  >
                    Remover
                  </Button>
                </div>

                <textarea
                  className="w-full min-h-[100px] rounded-md border p-3 text-sm"
                  value={item.text}
                  onChange={(e) =>
                    updateTextListItem(section.id, item.id, e.target.value)
                  }
                  placeholder="Cole aqui um item por vez."
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderDefinitionListSection(section: DefinitionListSection) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">Definições</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => addDefinitionItem(section.id)}
          >
            Adicionar definição
          </Button>
        </div>

        {section.items.length === 0 ? (
          <div className="rounded-md border p-4 text-sm text-muted-foreground">
            Nenhuma definição adicionada ainda.
          </div>
        ) : (
          <div className="space-y-3">
            {section.items.map((item) => (
              <div key={item.id} className="rounded-md border p-3 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{item.id}</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeDefinitionItem(section.id, item.id)}
                  >
                    Remover
                  </Button>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Termo</label>
                  <input
                    className="w-full rounded-md border p-2 text-sm"
                    value={item.term}
                    onChange={(e) =>
                      updateDefinitionItem(
                        section.id,
                        item.id,
                        "term",
                        e.target.value
                      )
                    }
                    placeholder="Ex.: ICA – Instruções de Aeronavegabilidade Continuada"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Definição
                  </label>
                  <textarea
                    className="w-full min-h-[120px] rounded-md border p-3 text-sm"
                    value={item.definition}
                    onChange={(e) =>
                      updateDefinitionItem(
                        section.id,
                        item.id,
                        "definition",
                        e.target.value
                      )
                    }
                    placeholder="Cole aqui a definição."
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderResponsibilityListSection(section: ResponsibilityListSection) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">Responsabilidades</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => addResponsibilityItem(section.id)}
          >
            Adicionar função
          </Button>
        </div>

        {section.items.length === 0 ? (
          <div className="rounded-md border p-4 text-sm text-muted-foreground">
            Nenhuma função adicionada ainda.
          </div>
        ) : (
          <div className="space-y-4">
            {section.items.map((item) => (
              <div key={item.id} className="rounded-md border p-3 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{item.id}</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeResponsibilityItem(section.id, item.id)}
                  >
                    Remover
                  </Button>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Função</label>
                  <input
                    className="w-full rounded-md border p-2 text-sm"
                    value={item.role}
                    onChange={(e) =>
                      updateResponsibilityRole(
                        section.id,
                        item.id,
                        e.target.value
                      )
                    }
                    placeholder="Ex.: Engenharia de Produto / Projeto"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className="block text-sm font-medium">
                      Responsabilidades da função
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addDutyToResponsibility(section.id, item.id)}
                    >
                      Adicionar responsabilidade
                    </Button>
                  </div>

                  {item.duties.length === 0 ? (
                    <div className="rounded-md border p-3 text-sm text-muted-foreground">
                      Nenhuma responsabilidade adicionada ainda.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {item.duties.map((duty, dutyIndex) => (
                        <div
                          key={`${item.id}-${dutyIndex}`}
                          className="rounded-md border p-3 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium">
                              {item.id}.{dutyIndex + 1}
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                removeDutyFromResponsibility(
                                  section.id,
                                  item.id,
                                  dutyIndex
                                )
                              }
                            >
                              Remover
                            </Button>
                          </div>

                          <textarea
                            className="w-full min-h-[90px] rounded-md border p-3 text-sm"
                            value={duty}
                            onChange={(e) =>
                              updateDutyInResponsibility(
                                section.id,
                                item.id,
                                dutyIndex,
                                e.target.value
                              )
                            }
                            placeholder="Cole aqui uma responsabilidade por vez."
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderSectionEditor(section: ProcedureSection) {
    switch (section.type) {
      case "text":
        return renderTextSection(section);

      case "text_list":
        return renderTextListSection(section);

      case "definition_list":
        return renderDefinitionListSection(section);

      case "responsibility_list":
        return renderResponsibilityListSection(section);

      case "process":
        return (
          <div className="space-y-3">
            <p className="text-sm font-medium">Etapas do processo</p>
            <div className="rounded-md border p-4 text-sm text-muted-foreground">
              Próxima etapa.
            </div>
          </div>
        );

      case "criteria_list":
        return (
          <div className="space-y-3">
            <p className="text-sm font-medium">Lista de critérios</p>
            <div className="rounded-md border p-4 text-sm text-muted-foreground">
              Próxima etapa.
            </div>
          </div>
        );

      case "table":
        return (
          <div className="space-y-3">
            <p className="text-sm font-medium">Tabela estruturada</p>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-muted/40">
                    {section.columns.map((col) => (
                      <th
                        key={col}
                        className="border px-3 py-2 text-left font-medium"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td
                      colSpan={section.columns.length}
                      className="border px-3 py-4 text-center text-muted-foreground"
                    >
                      Nenhuma linha adicionada nesta etapa
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );

      case "indicator_list":
        return (
          <div className="space-y-3">
            <p className="text-sm font-medium">Lista de indicadores</p>
            <div className="rounded-md border p-4 text-sm text-muted-foreground">
              Próxima etapa.
            </div>
          </div>
        );

      case "integration_list":
        return (
          <div className="space-y-3">
            <p className="text-sm font-medium">Lista de integrações</p>
            <div className="rounded-md border p-4 text-sm text-muted-foreground">
              Próxima etapa.
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cadastro Guiado de Procedimento</h1>
        <p className="text-muted-foreground mt-2">
          Estrutura controlada por capítulo, sem parsing automático.
        </p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Código</label>
            <input
              className="w-full rounded-md border p-2 text-sm"
              value={documento.code}
              onChange={(e) =>
                setDocumento((prev) => ({ ...prev, code: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Revisão</label>
            <input
              className="w-full rounded-md border p-2 text-sm"
              value={documento.revision}
              onChange={(e) =>
                setDocumento((prev) => ({ ...prev, revision: e.target.value }))
              }
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Nome</label>
          <input
            className="w-full rounded-md border p-2 text-sm"
            value={documento.name}
            onChange={(e) =>
              setDocumento((prev) => ({ ...prev, name: e.target.value }))
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Descrição</label>
          <input
            className="w-full rounded-md border p-2 text-sm"
            value={documento.description}
            onChange={(e) =>
              setDocumento((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={handleNovoProcedimento}>Novo procedimento</Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6">
        <Card className="p-4 space-y-3">
          <h2 className="text-lg font-semibold">Capítulos</h2>

          <div className="space-y-2">
            {documento.sections.map((section) => {
              const isSelected = section.id === selectedSectionId;

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setSelectedSectionId(section.id)}
                  className={`w-full rounded-md border p-3 text-left transition ${
                    isSelected ? "border-primary bg-muted" : "hover:bg-muted/50"
                  }`}
                >
                  <div className="font-medium">
                    {section.id}. {section.title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Tipo: {section.type}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getSectionSummary(section)}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          {selectedSection ? (
            <>
              <div>
                <h2 className="text-xl font-semibold">
                  {selectedSection.id}. {selectedSection.title}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Tipo estrutural: {selectedSection.type}
                </p>
              </div>

              {renderSectionEditor(selectedSection)}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum capítulo selecionado.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}