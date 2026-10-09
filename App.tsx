import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import AppleitorCbrModule from './modules/appleitor-cbr';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

const STORAGE_KEY = 'appleitor-library-v1';
type Comic = { id: string; name: string; uri: string; pages: string[]; progress: number };
const naturalSort = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
const readableName = (name: string) => name.replace(/\.cbr$/i, '').replace(/[._-]+/g, ' ').trim();

async function extractPage(comic: Comic, pageName: string) {
  return AppleitorCbrModule.extractPageAsync(comic.uri, pageName);
}

export default function App() {
  const { width, height } = useWindowDimensions();
  const [library, setLibrary] = useState<Comic[]>([]);
  const [activeComic, setActiveComic] = useState<Comic | null>(null);
  const [activePageUri, setActivePageUri] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  useEffect(() => { AsyncStorage.getItem(STORAGE_KEY).then((stored) => stored && setLibrary(JSON.parse(stored))); }, []);
  const saveLibrary = (next: Comic[]) => { setLibrary(next); AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)); };

  const importFiles = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', multiple: true, copyToCacheDirectory: true });
    if (result.canceled) return;
    setLoading(true);
    try {
      const imported: Comic[] = [];
      for (const asset of result.assets) {
        const fileName = asset.name ?? '';
        if (!fileName.toLowerCase().endsWith('.cbr')) continue;
        const pages = (await AppleitorCbrModule.listPagesAsync(asset.uri)).sort(naturalSort);
        if (!pages.length) continue;
        imported.push({ id: `${Date.now()}-${fileName}`, name: readableName(fileName), uri: asset.uri, pages, progress: 0 });
      }
      if (!imported.length) {
        Alert.alert('Arquivo inválido', 'Selecione um arquivo com extensão .CBR que contenha imagens.');
        return;
      }
      saveLibrary([...imported, ...library.filter((old) => !imported.some((item) => item.name === old.name))]);
    } catch (error) { const message = error instanceof Error ? error.message : 'Formato não reconhecido ou arquivo corrompido.'; Alert.alert('Não foi possível importar', message); } finally { setLoading(false); }
  };

  const openComic = async (comic: Comic) => {
    setActiveComic(comic); setLoading(true);
    try { setActivePageUri(await extractPage(comic, comic.pages[comic.progress])); } catch { Alert.alert('Erro ao abrir', 'Não foi possível extrair esta página.'); setActiveComic(null); } finally { setLoading(false); }
  };
  const goToPage = async (delta: number) => {
    if (!activeComic) return;
    const nextProgress = Math.max(0, Math.min(activeComic.pages.length - 1, activeComic.progress + delta));
    if (nextProgress === activeComic.progress) return;
    const nextComic = { ...activeComic, progress: nextProgress }; setActiveComic(nextComic); saveLibrary(library.map((comic) => comic.id === nextComic.id ? nextComic : comic)); setLoading(true);
    try { setActivePageUri(await extractPage(nextComic, nextComic.pages[nextProgress])); } finally { setLoading(false); }
  };
  const stats = useMemo(() => ({ total: library.length }), [library]);

  return <SafeAreaView style={styles.safe}><StatusBar style="light" />
    <View style={styles.header}><View><Text style={styles.eyebrow}>BIBLIOTECA ANDROID</Text><Text style={styles.logo}>appleitor</Text></View><Pressable style={styles.infoButton} onPress={() => setShowInfo(true)}><Text style={styles.infoText}>i</Text></Pressable></View>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.hero}><View style={styles.heroCopy}><Text style={styles.heroKicker}>LEIA SEM DISTRAÇÕES</Text><Text style={styles.heroTitle}>Sua estante,{`\n`}do seu jeito.</Text><Text style={styles.heroBody}>Importe seus quadrinhos CBR e continue de onde parou.</Text></View><View style={styles.heroMark}><Text style={styles.heroMarkText}>A</Text></View></View>
      <Pressable style={styles.importButton} onPress={importFiles} disabled={loading}>{loading ? <ActivityIndicator color="#101313" /> : <><Text style={styles.importIcon}>＋</Text><Text style={styles.importLabel}>Importar arquivos</Text></>}</Pressable>
      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Sua biblioteca</Text><Text style={styles.counter}>{stats.total} {stats.total === 1 ? 'título' : 'títulos'}</Text></View>
      {library.length === 0 ? <View style={styles.empty}><Text style={styles.emptySymbol}>▧</Text><Text style={styles.emptyTitle}>Nada por aqui ainda</Text><Text style={styles.emptyBody}>Toque em “Importar arquivos” para adicionar seus quadrinhos CBR.</Text></View> : <FlatList data={library} scrollEnabled={false} keyExtractor={(item) => item.id} renderItem={({ item }) => <Pressable style={styles.card} onPress={() => openComic(item)}><View style={[styles.cover, styles.coverCbr]}><Text style={styles.coverType}>CBR</Text><Text style={styles.coverLetter}>{item.name.charAt(0).toUpperCase()}</Text></View><View style={styles.cardDetails}><Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text><Text style={styles.cardMeta}>CBR · pronto para ler</Text><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${item.pages.length ? ((item.progress + 1) / item.pages.length) * 100 : 0}%` }]} /></View><Text style={styles.progressText}>{item.pages.length ? `Página ${item.progress + 1} de ${item.pages.length}` : 'Sem páginas de imagem'}</Text></View><Text style={styles.chevron}>›</Text></Pressable>} />}
      <View style={styles.footerNote}><Text style={styles.footerDot}>●</Text><Text style={styles.footerText}>Arquivos ficam no seu dispositivo</Text></View>
    </ScrollView>
    <Modal visible={!!activeComic} animationType="fade" onRequestClose={() => setActiveComic(null)}><SafeAreaView style={styles.reader}><View style={styles.readerTop}><Pressable onPress={() => setActiveComic(null)}><Text style={styles.close}>‹</Text></Pressable><Text style={styles.readerTitle} numberOfLines={1}>{activeComic?.name}</Text><Text style={styles.readerCount}>{activeComic ? `${activeComic.progress + 1}/${activeComic.pages.length}` : ''}</Text></View><View style={styles.pageArea}>{activePageUri && <Image source={{ uri: activePageUri }} style={{ width: width - 24, height: height - 180 }} resizeMode="contain" />}{loading && <ActivityIndicator size="large" color="#c6f36b" />}</View><View style={styles.readerControls}><Pressable style={styles.pageButton} onPress={() => goToPage(-1)}><Text style={styles.pageButtonText}>‹ anterior</Text></Pressable><Text style={styles.readerHint}>use os controles</Text><Pressable style={styles.pageButton} onPress={() => goToPage(1)}><Text style={styles.pageButtonText}>próxima ›</Text></Pressable></View></SafeAreaView></Modal>
    <Modal visible={showInfo} transparent animationType="fade" onRequestClose={() => setShowInfo(false)}><Pressable style={styles.overlay} onPress={() => setShowInfo(false)}><View style={styles.infoCard}><Text style={styles.infoTitle}>Sobre o Appleitor</Text><Text style={styles.infoBody}>Leitor Android focado em privacidade. Seus arquivos CBR são lidos localmente, sem envio para a internet.</Text><Text style={styles.infoBody}>As páginas são extraídas somente quando necessário para o cache.</Text><Pressable style={styles.doneButton} onPress={() => setShowInfo(false)}><Text style={styles.doneText}>Entendi</Text></Pressable></View></Pressable></Modal>
  </SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#101313' }, content: { padding: 20, paddingBottom: 40 }, header: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, eyebrow: { color: '#8d9890', fontSize: 10, letterSpacing: 2, fontWeight: '700' }, logo: { color: '#f3f6ee', fontSize: 26, fontWeight: '800', letterSpacing: -1 }, infoButton: { borderColor: '#435047', borderWidth: 1, borderRadius: 18, width: 34, height: 34, alignItems: 'center', justifyContent: 'center' }, infoText: { color: '#c6f36b', fontSize: 17, fontWeight: '700' }, hero: { borderRadius: 22, backgroundColor: '#1a211f', padding: 22, marginTop: 16, minHeight: 190, flexDirection: 'row', overflow: 'hidden' }, heroCopy: { flex: 1, zIndex: 1 }, heroKicker: { color: '#c6f36b', fontSize: 10, fontWeight: '800', letterSpacing: 1.6, marginBottom: 15 }, heroTitle: { color: '#f4f5ee', fontSize: 30, lineHeight: 32, fontWeight: '800', letterSpacing: -1 }, heroBody: { color: '#9ca79f', fontSize: 13, lineHeight: 19, marginTop: 12, maxWidth: 240 }, heroMark: { width: 112, height: 148, backgroundColor: '#c6f36b', borderRadius: 10, transform: [{ rotate: '12deg' }, { translateX: 24 }, { translateY: 8 }], justifyContent: 'center', alignItems: 'center' }, heroMarkText: { color: '#101313', fontSize: 92, fontWeight: '900', fontStyle: 'italic' }, importButton: { marginTop: 14, backgroundColor: '#c6f36b', borderRadius: 14, height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, importIcon: { color: '#101313', fontSize: 27 }, importLabel: { color: '#101313', fontSize: 15, fontWeight: '800' }, sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 30, marginBottom: 14 }, sectionTitle: { color: '#f4f5ee', fontSize: 20, fontWeight: '800' }, counter: { color: '#839087', fontSize: 12 }, empty: { borderWidth: 1, borderColor: '#2d3832', borderStyle: 'dashed', borderRadius: 18, padding: 28, alignItems: 'center' }, emptySymbol: { color: '#c6f36b', fontSize: 32, marginBottom: 8 }, emptyTitle: { color: '#e8ece3', fontWeight: '700', fontSize: 16 }, emptyBody: { color: '#89948c', textAlign: 'center', marginTop: 6, lineHeight: 19, fontSize: 13 }, card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a211f', borderRadius: 16, padding: 10, marginBottom: 10 }, cover: { width: 64, height: 82, borderRadius: 9, backgroundColor: '#465d43', justifyContent: 'space-between', padding: 7 }, coverCbr: { backgroundColor: '#514b43' }, coverType: { alignSelf: 'flex-start', color: '#101313', backgroundColor: '#c6f36b', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2, fontSize: 8, fontWeight: '900' }, coverLetter: { color: '#e7f5dd', fontSize: 34, fontWeight: '900', alignSelf: 'center' }, cardDetails: { flex: 1, paddingHorizontal: 12 }, cardTitle: { color: '#f1f3eb', fontSize: 15, fontWeight: '700', lineHeight: 19 }, cardMeta: { color: '#849088', marginTop: 4, fontSize: 11 }, progressTrack: { height: 4, backgroundColor: '#354239', borderRadius: 4, marginTop: 11 }, progressFill: { height: 4, backgroundColor: '#c6f36b', borderRadius: 4 }, progressText: { color: '#829087', fontSize: 10, marginTop: 5 }, chevron: { color: '#738078', fontSize: 28, paddingRight: 5 }, footerNote: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 24 }, footerDot: { color: '#c6f36b', fontSize: 10 }, footerText: { color: '#738078', fontSize: 11 }, reader: { flex: 1, backgroundColor: '#080a0a' }, readerTop: { height: 62, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }, close: { color: '#c6f36b', fontSize: 38 }, readerTitle: { color: '#f3f6ee', flex: 1, fontWeight: '700' }, readerCount: { color: '#8b978e', fontSize: 12 }, pageArea: { flex: 1, alignItems: 'center', justifyContent: 'center' }, readerControls: { height: 70, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, pageButton: { paddingVertical: 10, paddingHorizontal: 12 }, pageButtonText: { color: '#c6f36b', fontWeight: '700', fontSize: 12 }, readerHint: { color: '#5e6962', fontSize: 10 }, overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,.65)', justifyContent: 'center', padding: 24 }, infoCard: { backgroundColor: '#1a211f', borderRadius: 20, padding: 24 }, infoTitle: { color: '#f2f5ed', fontSize: 21, fontWeight: '800', marginBottom: 14 }, infoBody: { color: '#a8b2aa', lineHeight: 21, fontSize: 14, marginBottom: 10 }, doneButton: { backgroundColor: '#c6f36b', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 12 }, doneText: { color: '#101313', fontWeight: '800' } });
