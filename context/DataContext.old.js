'use client';

import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

// Criar o contexto com todos os valores iniciais
const DataContext = createContext({
  ip: 'unknown',
  userAgent: 'unknown',
  isLoaded: false,

  // Dados de usuário
  user: null,
  userProfile: null,
  updateUserProfile: async () => { },
  isAuthenticated: false,
  isLoadingUser: false,
  userError: null,
  hasRequiredSubmissionFields: () => false,

  // Dados de papers
  papers: [],
  currentPaper: null,
  paperStats: { total: 0, pending: 0, accepted: 0, rejected: 0, underReview: 0 },
  isLoadingPapers: false,
  papersError: null,
  fetchPaper: async () => { },
  createPaper: async () => { },
  updatePaper: async () => { },
  refreshPapers: async () => { },
  uploadPaperFile: async () => { },
  deletePaperFile: async () => { },
  getFileRequirements: () => [],

  // Dados de organização e eventos
  organizations: [],
  currentOrganization: null,
  events: [],
  currentEvent: null,
  areas: [],
  paperTypes: [],
  customFields: [],
  fileTypes: [],
  isLoadingOrg: false,
  orgError: null,
  selectOrganization: async () => { },
  selectEvent: async () => { },
  refreshOrganizations: async () => { }
});

// Hook personalizado para usar o contexto
export const useDataContext = () => useContext(DataContext);

// Provider component
export function DataProvider({ children }) {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading', 'authenticated', 'unauthenticated'

  // ===== ESTADO DE METADADOS =====
  const [metadata, setMetadata] = useState({
    ip: 'unknown',
    userAgent: 'unknown',
    isLoaded: false,
  });

  // ===== ESTADOS DE USUÁRIO =====
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [userError, setUserError] = useState(null);

  // ===== ESTADOS DE PAPERS =====
  const [papers, setPapers] = useState([]);
  const [currentPaper, setCurrentPaper] = useState(null);
  const [paperStats, setPaperStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
    underReview: 0
  });
  const [isLoadingPapers, setIsLoadingPapers] = useState(false);
  const [papersError, setPapersError] = useState(null);

  // ===== ESTADOS DE ORGANIZAÇÃO =====
  const [organizations, setOrganizations] = useState([]);
  const [currentOrganization, setCurrentOrganization] = useState(null);
  const [events, setEvents] = useState([]);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [areas, setAreas] = useState([]);
  const [paperTypes, setPaperTypes] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [fileTypes, setFileTypes] = useState([]);
  const [isLoadingOrg, setIsLoadingOrg] = useState(false);
  const [orgError, setOrgError] = useState(null);

  // Carregando a sessão
  useEffect(() => {
    const loadSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();

        if (data && data.user) {
          setSession(data);
          setStatus('authenticated');
        } else {
          setStatus('unauthenticated');
        }
      } catch (error) {
        console.error("Erro ao carregar sessão:", error);
        setStatus('unauthenticated');
      }
    };

    loadSession();
  }, []);

  // ===== FUNÇÕES PARA ORGANIZAÇÃO =====
  const fetchEvents = useCallback(async (organizationId) => {
    try {
      setIsLoadingOrg(true);
      const res = await fetch(`/api/organizations/${organizationId}/events`);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erro ao carregar eventos');
      }

      const data = await res.json();
      setEvents(data.events);

      const savedEventId = localStorage.getItem('currentEventId');
      if (savedEventId) {
        const savedEvent = data.events.find(event => event.id === savedEventId);
        if (savedEvent) {
          setCurrentEvent(savedEvent);
          fetchEventDetails(savedEvent.id);
        }
      }

      return data.events;
    } catch (err) {
      setOrgError(err.message);
      return [];
    } finally {
      setIsLoadingOrg(false);
    }
  }, []);

  const fetchEventDetails = async (eventId) => {
    try {
      setIsLoadingOrg(true);

      const areasRes = await fetch(`/api/events/${eventId}/areas`);
      if (areasRes.ok) {
        const areasData = await areasRes.json();
        setAreas(areasData.areas);
      }

      const typesRes = await fetch(`/api/events/${eventId}/paper-types`);
      if (typesRes.ok) {
        const typesData = await typesRes.json();
        setPaperTypes(typesData.paperTypes);
      }

      const fieldsRes = await fetch(`/api/events/${eventId}/fields`);
      if (fieldsRes.ok) {
        const fieldsData = await fieldsRes.json();
        setCustomFields(fieldsData.fields);
      }

      const fileTypesRes = await fetch(`/api/events/${eventId}/file-types`);
      if (fileTypesRes.ok) {
        const fileTypesData = await fileTypesRes.json();
        setFileTypes(fileTypesData.fileTypes);
      }

      return true;
    } catch (err) {
      setOrgError(err.message);
      return false;
    } finally {
      setIsLoadingOrg(false);
    }
  };

  // ===== EFEITO PARA CARREGAR METADADOS (IP/USER AGENT) =====
  useEffect(() => {
    const fetchIpInfo = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        if (response.ok) {
          const data = await response.json();
          setMetadata({
            ip: data.ip,
            userAgent: navigator.userAgent,
            isLoaded: true,
          });

          sessionStorage.setItem('auth_metadata', JSON.stringify({
            ip: data.ip,
            userAgent: navigator.userAgent,
            timestamp: new Date().getTime(),
          }));
        }
      } catch (error) {
        console.error('Erro ao obter informações de IP:', error);
        setMetadata({
          ip: 'unknown',
          userAgent: navigator.userAgent,
          isLoaded: true,
        });
      }
    };

    const storedMetadata = sessionStorage.getItem('auth_metadata');
    if (storedMetadata) {
      try {
        const parsedData = JSON.parse(storedMetadata);
        const isRecent = (new Date().getTime() - parsedData.timestamp) < 3600000;

        if (isRecent) {
          setMetadata({
            ip: parsedData.ip,
            userAgent: parsedData.userAgent,
            isLoaded: true,
          });
        } else {
          fetchIpInfo();
        }
      } catch (e) {
        console.error('Erro ao recuperar metadata do sessionStorage:', e);
        fetchIpInfo();
      }
    } else {
      fetchIpInfo();
    }
  }, []);

  // ===== EFEITO PARA CARREGAR DADOS DO USUÁRIO =====
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (status === 'authenticated' && session?.user?.id) {
        try {
          setIsLoadingUser(true);
          const res = await fetch('/api/user/me');

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Erro ao carregar perfil');
          }

          const data = await res.json();
          setUserProfile(data.user);
          setUser({ ...session.user, ...data.user });
        } catch (err) {
          console.error('Erro ao carregar perfil do usuário:', err);
          setUserError(err.message);
        } finally {
          setIsLoadingUser(false);
        }
      } else if (status === 'unauthenticated') {
        setUser(null);
        setUserProfile(null);
        setIsLoadingUser(false);
      }
    };

    fetchUserProfile();
  }, [session, status]);

  // ===== EFEITO PARA CARREGAR PAPERS DO USUÁRIO =====
  useEffect(() => {
    const fetchPapers = async () => {
      if (status === 'authenticated' && session?.user?.id) {
        try {
          setIsLoadingPapers(true);
          const res = await fetch('/api/paper');

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Erro ao carregar papers');
          }

          const data = await res.json();
          setPapers(data.papers);

          const stats = {
            total: data.papers.length,
            pending: data.papers.filter(p => p.status === 'PENDING').length,
            accepted: data.papers.filter(p => ['ACCEPTED', 'PUBLISHED'].includes(p.status)).length,
            rejected: data.papers.filter(p => p.status === 'REJECTED').length,
            underReview: data.papers.filter(p => p.status === 'UNDER_REVIEW').length
          };
          setPaperStats(stats);

        } catch (err) {
          console.error('Erro ao carregar papers:', err);
          setPapersError(err.message);
        } finally {
          setIsLoadingPapers(false);
        }
      }
    };

    if (status === 'authenticated') {
      fetchPapers();
    }
  }, [session, status]);

  // ===== EFEITO PARA CARREGAR ORGANIZAÇÕES DO USUÁRIO =====
  useEffect(() => {
    const fetchOrganizations = async () => {
      if (status === 'authenticated' && session?.user?.id) {
        try {
          setIsLoadingOrg(true);
          const res = await fetch('/api/organizations/user');

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Erro ao carregar organizações');
          }

          const data = await res.json();
          setOrganizations(data.organizations);

          const savedOrgId = localStorage.getItem('currentOrganizationId');
          if (savedOrgId) {
            const savedOrg = data.organizations.find(org => org.id === savedOrgId);
            if (savedOrg) {
              setCurrentOrganization(savedOrg);
              fetchEvents(savedOrgId);
            }
          }
        } catch (err) {
          console.error('Erro ao carregar organizações:', err);
          setOrgError(err.message);
        } finally {
          setIsLoadingOrg(false);
        }
      }
    };

    if (status === 'authenticated') {
      fetchOrganizations();
    }
  }, [session, status, fetchEvents]);

  // ===== FUNÇÕES PARA USUÁRIO =====
  const updateUserProfile = async (profileData) => {
    try {
      setIsLoadingUser(true);
      const res = await fetch('/api/user/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erro ao atualizar perfil');
      }

      const data = await res.json();
      setUserProfile(data.user);
      setUser(prev => ({ ...prev, ...data.user }));

      return { success: true, user: data.user };
    } catch (err) {
      setUserError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoadingUser(false);
    }
  };

  const hasRequiredSubmissionFields = () => {
    if (!userProfile) return false;

    return !!(
      userProfile.cpf &&
      userProfile.phone &&
      userProfile.institution &&
      userProfile.city &&
      userProfile.stateId
    );
  };

  // ===== FUNÇÕES PARA PAPERS =====
  const fetchPaper = async (paperId) => {
    try {
      setIsLoadingPapers(true);
      const res = await fetch(`/api/papers/${paperId}`);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erro ao carregar paper');
      }

      const data = await res.json();
      setCurrentPaper(data.paper);
      return data.paper;
    } catch (err) {
      setPapersError(err.message);
      return null;
    } finally {
      setIsLoadingPapers(false);
    }
  };

  const createPaper = async (paperData) => {
    try {
      setIsLoadingPapers(true);
      const formData = new FormData();

      Object.keys(paperData).forEach(key => {
        if (key !== 'files') {
          formData.append(key, paperData[key]);
        }
      });

      if (paperData.files && Array.isArray(paperData.files)) {
        formData.append('filesCount', paperData.files.length);

        paperData.files.forEach((fileObj, index) => {
          if (fileObj.file) {
            formData.append(`files[${index}]`, fileObj.file);
            formData.append(`fileTypes[${index}]`, fileObj.fileTypeId || 'none');
          }
        });
      }

      const res = await fetch('/api/papers', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erro ao criar paper');
      }

      const data = await res.json();

      setPapers(prevPapers => [data.paper, ...prevPapers]);
      setPaperStats(prev => ({
        ...prev,
        total: prev.total + 1,
        pending: prev.pending + 1
      }));

      return { success: true, paper: data.paper };
    } catch (err) {
      setPapersError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoadingPapers(false);
    }
  };

  const updatePaper = async (paperId, paperData) => {
    try {
      setIsLoadingPapers(true);
      const formData = new FormData();

      Object.keys(paperData).forEach(key => {
        if (key !== 'files') {
          formData.append(key, paperData[key]);
        }
      });

      if (paperData.files && Array.isArray(paperData.files)) {
        formData.append('filesCount', paperData.files.length);

        paperData.files.forEach((fileObj, index) => {
          if (fileObj.file) {
            formData.append(`files[${index}]`, fileObj.file);
            formData.append(`fileTypes[${index}]`, fileObj.fileTypeId || 'none');
            if (fileObj.id) {
              formData.append(`fileIds[${index}]`, fileObj.id);
            }
          } else if (fileObj.id) {
            formData.append(`existingFiles[${index}]`, fileObj.id);
          }
        });

        if (paperData.filesToRemove && Array.isArray(paperData.filesToRemove)) {
          paperData.filesToRemove.forEach((fileId, index) => {
            formData.append(`removeFiles[${index}]`, fileId);
          });
        }
      }

      const res = await fetch(`/api/papers/${paperId}`, {
        method: 'PUT',
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erro ao atualizar paper');
      }

      const data = await res.json();

      setPapers(prevPapers =>
        prevPapers.map(paper =>
          paper.id === paperId ? data.paper : paper
        )
      );
      setCurrentPaper(data.paper);

      return { success: true, paper: data.paper };
    } catch (err) {
      setPapersError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoadingPapers(false);
    }
  };

  const uploadPaperFile = async (paperId, fileData) => {
    try {
      setIsLoadingPapers(true);
      const formData = new FormData();

      formData.append('file', fileData.file);
      formData.append('fileTypeId', fileData.fileTypeId || '');

      const res = await fetch(`/api/papers/${paperId}/files`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erro ao enviar arquivo');
      }

      const data = await res.json();

      if (currentPaper && currentPaper.id === paperId) {
        setCurrentPaper(prev => ({
          ...prev,
          files: [...(prev.files || []), data.file]
        }));
      }

      return { success: true, file: data.file };
    } catch (err) {
      setPapersError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoadingPapers(false);
    }
  };

  const deletePaperFile = async (paperId, fileId) => {
    try {
      setIsLoadingPapers(true);

      const res = await fetch(`/api/papers/${paperId}/files/${fileId}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erro ao remover arquivo');
      }

      if (currentPaper && currentPaper.id === paperId) {
        setCurrentPaper(prev => ({
          ...prev,
          files: prev.files.filter(file => file.id !== fileId)
        }));
      }

      return { success: true };
    } catch (err) {
      setPapersError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoadingPapers(false);
    }
  };

  const getFileRequirements = (eventId) => {
    if (!eventId) return [];
    return fileTypes.filter(fileType => fileType.eventId === eventId);
  };

  const validatePaperFiles = (paper) => {
    if (!paper || !paper.eventId) return { isValid: false, missingFiles: [] };

    const requiredFileTypes = fileTypes.filter(
      type => type.eventId === paper.eventId && type.isRequired
    );

    if (requiredFileTypes.length === 0) return { isValid: true, missingFiles: [] };

    const paperFileTypeIds = paper.files?.map(file => file.fileTypeId) || [];
    const missingFiles = requiredFileTypes.filter(
      type => !paperFileTypeIds.includes(type.id)
    );

    return {
      isValid: missingFiles.length === 0,
      missingFiles
    };
  };

  const refreshPapers = async () => {
    try {
      setIsLoadingPapers(true);
      const res = await fetch('/api/paper');

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erro ao carregar papers');
      }

      const data = await res.json();
      setPapers(data.papers);

      const stats = {
        total: data.papers.length,
        pending: data.papers.filter(p => p.status === 'PENDING').length,
        accepted: data.papers.filter(p => ['ACCEPTED', 'PUBLISHED'].includes(p.status)).length,
        rejected: data.papers.filter(p => p.status === 'REJECTED').length,
        underReview: data.papers.filter(p => p.status === 'UNDER_REVIEW').length
      };
      setPaperStats(stats);

      return data.papers;
    } catch (err) {
      setPapersError(err.message);
      return [];
    } finally {
      setIsLoadingPapers(false);
    }
  };

  // ===== FUNÇÕES PARA ORGANIZAÇÕES E EVENTOS =====
  const selectOrganization = async (orgId) => {
    const org = organizations.find(o => o.id === orgId);
    if (org) {
      setCurrentOrganization(org);
      localStorage.setItem('currentOrganizationId', orgId);

      setCurrentEvent(null);
      localStorage.removeItem('currentEventId');

      await fetchEvents(orgId);
      return true;
    }
    return false;
  };

  const selectEvent = async (eventId) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      setCurrentEvent(event);
      localStorage.setItem('currentEventId', eventId);

      await fetchEventDetails(eventId);
      return true;
    }
    return false;
  };

  const refreshOrganizations = async () => {
    try {
      setIsLoadingOrg(true);
      const res = await fetch('/api/organizations/user');

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erro ao carregar organizações');
      }

      const data = await res.json();
      setOrganizations(data.organizations);
      return data.organizations;
    } catch (err) {
      setOrgError(err.message);
      return [];
    } finally {
      setIsLoadingOrg(false);
    }
  };

  const contextValue = {
    ...metadata,

    user,
    userProfile,
    updateUserProfile,
    isAuthenticated: status === 'authenticated',
    isLoadingUser,
    userError,
    hasRequiredSubmissionFields,

    papers,
    currentPaper,
    paperStats,
    isLoadingPapers,
    papersError,
    fetchPaper,
    createPaper,
    updatePaper,
    refreshPapers,
    uploadPaperFile,
    deletePaperFile,
    getFileRequirements,
    validatePaperFiles,

    organizations,
    currentOrganization,
    events,
    currentEvent,
    areas,
    paperTypes,
    customFields,
    fileTypes,
    isLoadingOrg,
    orgError,
    selectOrganization,
    selectEvent,
    refreshOrganizations,

    isLoading: isLoadingUser || isLoadingPapers || isLoadingOrg
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
}

// Hooks personalizados para facilitar o acesso a grupos específicos de dados
export const useUser = () => {
  const context = useDataContext();
  return {
    user: context.user,
    userProfile: context.userProfile,
    updateUserProfile: context.updateUserProfile,
    isAuthenticated: context.isAuthenticated,
    isLoading: context.isLoadingUser,
    error: context.userError,
    hasRequiredSubmissionFields: context.hasRequiredSubmissionFields
  };
};

export const usePapers = () => {
  const context = useDataContext();
  return {
    papers: context.papers,
    currentPaper: context.currentPaper,
    stats: context.paperStats,
    isLoading: context.isLoadingPapers,
    error: context.papersError,
    fetchPaper: context.fetchPaper,
    createPaper: context.createPaper,
    updatePaper: context.updatePaper,
    refreshPapers: context.refreshPapers,
    uploadPaperFile: context.uploadPaperFile,
    deletePaperFile: context.deletePaperFile,
    getFileRequirements: context.getFileRequirements,
    validatePaperFiles: context.validatePaperFiles
  };
};

export const useOrganization = () => {
  const context = useDataContext();
  return {
    organizations: context.organizations,
    currentOrganization: context.currentOrganization,
    events: context.events,
    currentEvent: context.currentEvent,
    areas: context.areas,
    paperTypes: context.paperTypes,
    customFields: context.customFields,
    fileTypes: context.fileTypes,
    isLoading: context.isLoadingOrg,
    error: context.orgError,
    selectOrganization: context.selectOrganization,
    selectEvent: context.selectEvent,
    refreshOrganizations: context.refreshOrganizations
  };
};