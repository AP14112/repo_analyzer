from pathlib import Path
import os
import shutil
import stat
import subprocess

from git import Repo
from git.exc import GitCommandError

from app.exceptions.repository import RepositoryCloneError


class GitService:

    def get_remote_commit(
        self,
        github_url: str,
    ) -> str:

        try:

            result = subprocess.run(
                [
                    "git",
                    "ls-remote",
                    github_url,
                    "HEAD",
                ],
                capture_output=True,
                text=True,
                check=True,
            )

            output = result.stdout.strip()

            if not output:
                raise RepositoryCloneError(
                    "Unable to determine repository commit."
                )

            commit_hash = output.split()[0]

            print(
                f"Remote commit: {commit_hash}"
            )

            return commit_hash

        except subprocess.CalledProcessError as e:

            print(
                "Unable to get remote repository commit."
            )

            print(e.stderr)

            raise RepositoryCloneError(
                "Unable to determine remote repository commit."
            ) from e

    def clone_repository(
        self,
        github_url: str,
        destination: Path,
    ) -> None:

        try:

            if destination.exists():

                print(
                    f"Removing previous repository directory: "
                    f"{destination}"
                )

                self._remove_directory(
                    destination
                )

            destination.parent.mkdir(
                parents=True,
                exist_ok=True,
            )

            print(
                f"Cloning repository: {github_url}"
            )

            print(
                f"Destination: {destination}"
            )

            Repo.clone_from(
                github_url,
                destination,
            )

            print(
                "Clone successful"
            )

        except GitCommandError as e:

            print(
                "Git clone failed:"
            )

            print(e)

            raise RepositoryCloneError(
                f"Unable to clone repository: {e}"
            ) from e

        except OSError as e:

            print(
                "Unable to prepare repository directory:"
            )

            print(e)

            raise RepositoryCloneError(
                f"Unable to prepare repository directory: {e}"
            ) from e

    def _remove_directory(
        self,
        directory: Path,
    ) -> None:

        if not directory.exists():
            return

        def handle_remove_error(
            func,
            path,
            exc,
        ):
            try:

                os.chmod(
                    path,
                    stat.S_IWRITE,
                )

                func(path)

            except Exception:
                raise

        try:

            shutil.rmtree(
                directory,
                onexc=handle_remove_error,
            )

        except OSError as e:

            raise RepositoryCloneError(
                "Unable to remove existing "
                f"repository directory: {directory}"
            ) from e