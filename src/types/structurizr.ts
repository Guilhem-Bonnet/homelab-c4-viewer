export type StructurizrElement = {
  id: string;
  name: string;
  type?: string;
  description?: string;
  technology?: string;
  tags?: string;
  relationships?: StructurizrRelationship[];
};

export type StructurizrSoftwareSystem = StructurizrElement & {
  containers?: StructurizrElement[];
};

export type StructurizrRelationship = {
  id: string;
  sourceId: string;
  destinationId: string;
  description?: string;
  technology?: string;
  tags?: string;
};

export type StructurizrViewElement = {
  id: string;
  x?: number;
  y?: number;
};

export type StructurizrContainerView = {
  key: string;
  title?: string;
  description?: string;
  elements?: StructurizrViewElement[];
  relationships?: { id: string }[];
};

export type StructurizrWorkspace = {
  name?: string;
  model?: {
    people?: StructurizrElement[];
    softwareSystems?: StructurizrSoftwareSystem[];
    relationships?: StructurizrRelationship[];
  };
  views?: {
    systemLandscapeViews?: StructurizrContainerView[];
    systemContextViews?: StructurizrContainerView[];
    containerViews?: StructurizrContainerView[];
    componentViews?: StructurizrContainerView[];
    deploymentViews?: StructurizrContainerView[];
  };
};
