import io
import json
import os
import subprocess
import sys
import unittest
from contextlib import redirect_stdout

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, RAIZ)

import escolher  # noqa: E402

FERR = escolher.carregar()


class TestRepos(unittest.TestCase):
    def test_campos_obrigatorios(self):
        campos = {"nome", "repo", "url", "estrelas", "licenca", "stack", "tipos", "resolve",
                  "peso", "gpu", "voz", "instalar", "observacoes", "inema", "so_estudo", "grupo"}
        for f in FERR:
            self.assertTrue(campos <= set(f), f"{f.get('nome')}: faltam {campos - set(f)}")
            self.assertIn(f["gpu"], ("nao", "opcional", "sim"))
            self.assertIn(f["voz"], ("nao", "opcional", "sim"))
            self.assertTrue(f["url"].startswith("https://github.com/"))

    def test_nomes_unicos(self):
        nomes = [f["nome"] for f in FERR]
        self.assertEqual(len(nomes), len(set(nomes)))

    def test_pdoom_so_estudo(self):
        pd = [f for f in FERR if f["repo"] == "JohnHeibel/PDoomVideo"][0]
        self.assertTrue(pd["so_estudo"])

    def test_inclui_os_grupos(self):
        repos = {f["repo"] for f in FERR}
        for r in ("lemomo-ai/lemo-opuscar", "heygen-com/hyperframes", "latent-spaces/brag",
                  "openfilm/openfilm", "academa-labs/manimgx", "inematds/video-codigo",
                  "inematds/reel-ciencia-3d", "3b1b/manim"):
            self.assertIn(r, repos)


class TestRecomendar(unittest.TestCase):
    def _checa(self, tipo, gpu="nao", voz="nao"):
        recs = escolher.recomendar(tipo, gpu, voz, FERR)
        self.assertGreaterEqual(len(recs), 1, tipo)
        self.assertLessEqual(len(recs), 3, tipo)
        for r in recs:
            self.assertIn(tipo, r["tipos"])
            self.assertFalse(r["so_estudo"])
            self.assertTrue(r["porque"])
            self.assertTrue(r["instalar"])
            if gpu == "nao":
                self.assertNotEqual(r["gpu"], "sim")
            if voz == "sim":
                self.assertNotEqual(r["voz"], "nao")
        self.assertTrue(os.path.isfile(os.path.join(RAIZ, escolher.caminho_prompt(tipo))), tipo)
        return recs

    def test_desenho(self):
        recs = self._checa("desenho")
        self.assertEqual(recs[0]["nome"], "claude-animation-base")

    def test_clipe_com_gpu(self):
        recs = self._checa("clipe", gpu="sim")
        self.assertEqual(recs[0]["nome"], "functional-emotions-video")

    def test_clipe_sem_gpu(self):
        recs = self._checa("clipe", gpu="nao")
        self.assertNotIn("functional-emotions-video", [r["nome"] for r in recs])
        self.assertIn("hyperframes", [r["nome"] for r in recs])

    def test_clipe_estudo_pdoom(self):
        est = escolher.referencias_estudo("clipe", FERR)
        self.assertEqual([e["repo"] for e in est], ["JohnHeibel/PDoomVideo"])

    def test_lancamento(self):
        recs = self._checa("lancamento")
        self.assertIn("brag", [r["nome"] for r in recs])

    def test_lancamento_com_voz_tira_brag(self):
        recs = self._checa("lancamento", voz="sim")
        self.assertNotIn("brag", [r["nome"] for r in recs])

    def test_explicativo(self):
        recs = self._checa("explicativo", voz="sim")
        self.assertIn(recs[0]["nome"], ("hyperframes", "video-codigo", "lemo-opuscar"))

    def test_estilo_cinema(self):
        recs = self._checa("estilo-cinema")
        self.assertEqual(recs[0]["nome"], "lemo-opuscar")

    def test_ciencia_3d(self):
        recs = self._checa("ciencia-3d")
        self.assertIn("reel-ciencia-3d", [r["nome"] for r in recs])

    def test_matematica(self):
        recs = self._checa("matematica")
        self.assertIn("manimgx", [r["nome"] for r in recs])

    def test_dados(self):
        self._checa("dados")

    def test_b_roll(self):
        recs = self._checa("b-roll", voz="sim")
        self.assertEqual(recs[0]["nome"], "video-codigo")

    def test_quadro_negro(self):
        self._checa("quadro-negro")

    def test_todos_os_tipos_com_todos_os_filtros(self):
        for tipo in escolher.TIPOS:
            for gpu in ("sim", "nao"):
                recs = escolher.recomendar(tipo, gpu, "nao", FERR)
                self.assertGreaterEqual(len(recs), 1, (tipo, gpu))

    def test_tipo_invalido(self):
        with self.assertRaises(ValueError):
            escolher.recomendar("novela", ferramentas=FERR)


class TestInterface(unittest.TestCase):
    def test_perguntar(self):
        respostas = iter(["xyz", "2", "s", "n"])
        tipo, gpu, voz = escolher.perguntar(entrada=lambda _: next(respostas), saida=lambda *_: None)
        self.assertEqual((tipo, gpu, voz), ("clipe", "sim", "nao"))

    def test_perguntar_por_nome(self):
        respostas = iter(["ciencia-3d", "n", "sim"])
        self.assertEqual(escolher.perguntar(entrada=lambda _: next(respostas), saida=lambda *_: None),
                         ("ciencia-3d", "nao", "sim"))

    def test_main_texto(self):
        buf = io.StringIO()
        with redirect_stdout(buf):
            cod = escolher.main(["--tipo", "explicativo", "--voz", "sim"])
        self.assertEqual(cod, 0)
        out = buf.getvalue()
        self.assertIn("Instalar:", out)
        self.assertIn("prompts/explicativo.md", out)

    def test_cli_json(self):
        p = subprocess.run([sys.executable, os.path.join(RAIZ, "escolher.py"), "--tipo", "b-roll", "--json"],
                           capture_output=True, text=True, stdin=subprocess.DEVNULL)
        self.assertEqual(p.returncode, 0, p.stderr)
        d = json.loads(p.stdout)
        self.assertEqual(d["tipo"], "b-roll")
        self.assertTrue(1 <= len(d["recomendacoes"]) <= 3)

    def test_cli_sem_tipo_sem_terminal(self):
        p = subprocess.run([sys.executable, os.path.join(RAIZ, "escolher.py")],
                           capture_output=True, text=True, stdin=subprocess.DEVNULL)
        self.assertNotEqual(p.returncode, 0)


if __name__ == "__main__":
    unittest.main()
