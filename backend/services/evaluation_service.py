import os
import time
import json


def get_evaluation_data(model, experiment, host_url):
    """
    Načte vyhodnocovací data pro daný experiment.

    Args:
        experiment (str): Identifikátor experimentu (např. "exp6").
        host_url (str): Základní URL serveru (např. request.host_url.rstrip('/')).
        timeout (int): Maximální doba čekání v sekundách.
        poll_interval (int): Interval pro kontrolu existence složky.

    Returns:
        dict: Vyhodnocovací data včetně URL pro confusion matrix a F1 curve.

    Raises:
        Exception: Pokud složka s experimentem nebo eval. soubor není nalezen, případně při chybě čtení.
    """
    base_train_dir = os.path.join(os.getcwd(), model, "runs", "train")
    experiment_folder = os.path.join(base_train_dir, experiment)

    if not os.path.exists(experiment_folder):
        raise Exception("Train run folder not found")

    eval_data = {
        "confusion_matrix_url": f"{host_url}/api/evaluation/file/{model}/{experiment}/confusion_matrix.png",
        "f1_curve_url": f"{host_url}/api/evaluation/file/{model}/{experiment}/F1_curve.png"
    }
    return eval_data
