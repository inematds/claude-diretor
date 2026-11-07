import os
import subprocess
import tempfile
import unittest

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPT = os.path.join(RAIZ, "instalar.sh")


def rodar(*args, destino):
    env = dict(os.environ, DIRETOR_DIR=destino, DISPLAY="")
    return subprocess.run(["bash", SCRIPT, *args], capture_output=True, text=True, env=env)


class TestInstalar(unittest.TestCase):
    def test_pdoom_nao_clona(self):
        with tempfile.TemporaryDirectory() as d:
            p = rodar("PDoomVideo", destino=d)
            self.assertEqual(p.returncode, 0, p.stderr)
            self.assertIn("só para estudo", p.stdout)
            self.assertIn("https://github.com/JohnHeibel/PDoomVideo", p.stdout)
            self.assertEqual(os.listdir(d), [])

    def test_nome_desconhecido(self):
        with tempfile.TemporaryDirectory() as d:
            p = rodar("nao-existe", destino=d)
            self.assertEqual(p.returncode, 3)

    def test_listar(self):
        with tempfile.TemporaryDirectory() as d:
            p = rodar("--listar", destino=d)
            self.assertEqual(p.returncode, 0)
            self.assertIn("hyperframes", p.stdout)
            self.assertIn("(só estudo)", p.stdout)

    def test_sem_nome(self):
        with tempfile.TemporaryDirectory() as d:
            self.assertEqual(rodar(destino=d).returncode, 2)


if __name__ == "__main__":
    unittest.main()
